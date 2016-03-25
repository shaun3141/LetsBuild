"use strict"

const azure = require('azure-storage');
const Promise = require('bluebird');
const https = require('https');
const redis = require('redis');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
Promise.promisifyAll(azure.QueueService.prototype);

let redisClient = redis.createClient({
	host: process.env.REDIS_HOST,
	auth_pass: process.env.REDIS_PASSWORD,
	port: process.env.REDIS_PORT || 6379
})
redisClient.on('error', (err) => {
   console.error(`Redis died: ${err.message}`); 
})

let queueBackoff = QueueBackoffGenerator();
let radarBackoff = RadarBackoffGenerator();
let queueService = azure.createQueueService(process.env.AZURE_STORAGE_CONNECTION_STRING);

findQueueAndProcessAsync();

// Generator for exponential backoff
function* BackOffgenerator(initialValue, factor, ceiling) {
    yield initialValue;
    while (true) {
        initialValue = Math.min(ceiling, initialValue * factor);
        yield initialValue;
    }
}

// Create a Backoff Generator for the queue
function QueueBackoffGenerator() {
    return BackOffgenerator(
        process.env.QUEUE_BACKOFF_INITIAL || 5,
        process.env.QUEUE_BACKOFF_FACTOR || 2,
        process.env.QUEUE_BACKOFF_CEILING || 1000
    );
}

// Create a Backoff Generator for radar searches
function RadarBackoffGenerator() {
    return BackOffgenerator(
        process.env.RADAR_BACKOFF_INITIAL || 50,
        process.env.RADAR_BACKOFF_FACTOR || 2,
        process.env.RADAR_BACKOFF_CEILING || 120000
    );
}

// Grab the next zip queue and process it. Repeat when done
function findQueueAndProcessAsync() {
    console.log('Looking for queue...');
    return queueService.listQueuesSegmentedWithPrefixAsync(process.env.ZIP_QUEUE_NAME, null)
    .then((results) => {
        if (results.entries.length == 0) {
            let delay = queueBackoff.next().value;
            console.log(`No queue found, waiting ${delay}ms to look again\n`);
            return findQueueDelayedAndProcessAsync(delay);
        }
        else {
            console.log(`Processing queue: ${results.entries[0].name}`)
            return processQueueAsync(results.entries[0].name)
                .then(() => {
                    queueBackoff = QueueBackoffGenerator()
                })
                .then(() => findQueueAndProcessAsync())
                .catch((err) => console.error(`${err.name}: ${err.message}`))
                .then(() => findQueueDelayedAndProcessAsync(queueBackoff.next().value));
        }
    })
}

// Wait a little bit of time and then try to grab a queue again. Uses exponential back
function findQueueDelayedAndProcessAsync(timeMs) {
    return new Promise((resolve, reject) => setTimeout(resolve, timeMs))
    .then(() => findQueueAndProcessAsync());
}

// Process all messages in the zip queue until it is done then delete it
function processQueueAsync(queueName, placeSet) {
    const VISIBILITY_TIMEOUT_SECS = 60;
    const VISIBILITY_UPDATE_SECS = 30;
    
    // Don't add duplicate places this server has seen to the queue, store them in the set
    if (!placeSet) {
        placeSet = new Set();
    }
    
    return queueService.getMessagesAsync(queueName, {peekOnly: false, visibilityTimeout: VISIBILITY_TIMEOUT_SECS})
        .then((messages) => {
            // Delete the queue if we're out of messages
            if (messages.length == 0) {
                console.log('\nNo messages found')
                return deleteZipQueueIfDoneAsync(queueName);
            }

            // Update the timeout of the message until we're done with it.
            let message = messages[0];
            let intervalId = setInterval(() => {
                console.log(`Updating timeout for message ${message.messageid}`);
                queueService.updateMessageAsync(queueName, message.messageid, message.popreceipt, VISIBILITY_TIMEOUT_SECS)
                .then((newMessage) => message = newMessage);
            }, VISIBILITY_UPDATE_SECS * 1000);
            
            return processZipMessageAsync(message, placeSet)
             .then(() => queueService.deleteMessageAsync(queueName, message.messageid, message.popreceipt))
             .catch((error) => {
                 throw error;
             })
             .finally(() => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
             })

        })
        .catch((error) => { throw error; });
}

// Delete the zip queue if it is ready to be deleted
function deleteZipQueueIfDoneAsync(queueName) {
    console.log(`Seeing if we can delete queue: ${queueName}`)
    
    // Grab the id from the name
    let jobId = parseInt(queueName.match(`${process.env.ZIP_QUEUE_NAME}-(.*)`)[1]);
    
    // Something behind us fucked up...
    if (!jobId) {
        throw new Error(`Invalid Queue Name: ${queueName}\n`);
    }
    
    return redisClient.hgetAsync(`job${jobId}`, 'status')
    .then((status) => {
        // Make sure we're not still add anything
        if (status == 'ADDING_TO_ZIP_QUEUE') {
            console.log(`Charlotte's API is still adding messages\n`)
            return null
        }
        
        // Make sure there aren't any hidden messages still being processed
        return queueService.getQueueMetadataAsync(queueName)
        .then((metadata) => metadata.approximatemessagecount)
        .then((messageCount) => {
            // This queue is completely done, remove it and change the state
            if (messageCount == 0) {
                console.log('Deleting queue\n');
                return redisClient.hsetAsync(`job${jobId}`, 'status', 'SCRAPING')
                .then(() => queueService.deleteQueueIfExistsAsync(queueName));
            }
            
            console.log('The queue has invisible messages, don\'t delete it yet\n');
            return null;
        })
    })
    .catch((error) => {
        throw new Error(`Error deleting queue ${queueName}: ${error.name} ${error.message}`);
    })
}

// Do a radar search for all of the zips in a zip message and place them in the scrape queue
function processZipMessageAsync(message, placeSet) {
    console.log(`\nProcessing message: ${message.messageid}`);
    let zipBatch = JSON.parse(message.messagetext);
    
    // Use a pool of 40 connections for Radar searches
    const MAX_SOCKETS = 40;
    let httpAgent = new https.Agent({keepAlive: true, maxSockets: MAX_SOCKETS});
    console.log('Doing radar searches')
    let radarPromises = zipBatch.regions.map((region) => {
        return radarSearchAsync(region, zipBatch.keywords, httpAgent)
        .then((radarResponse) => radarResponse.results);
    });
    
    return Promise.all(radarPromises)
    .then((radarResults) => {
        console.log('Done with radar searches');
        // Reset the radar backoff
        radarBackoff = RadarBackoffGenerator();
        
        let placeIds = [];
        
        // Add all unique new places to the list
        radarResults.forEach((searchResults) => {
            
            searchResults.forEach((result) => {
                if (!placeSet.has(result.place_id))
                    placeIds.push(result.place_id);
            });  
            
            // Add our places to the set
            placeIds.forEach((id) => placeSet.add(id));
        })
                
        const BATCH_SIZE = 100;
        return redisClient.multi()
            .hset('job' + zipBatch.jobId, 'status', 'ADDING_TO_PLACES')
            .hincrby('job' + zipBatch.jobId, 'discovered_places', placeIds.length)
            .hincrby('job' + zipBatch.jobId, 'started_zips', zipBatch.regions.length)
            .execAsync()
            .then(() => enqueuePlacesAsync(placeIds, BATCH_SIZE, zipBatch.jobId))
    })
    .catch((error) => {
        // Tell Redis we're stalled
        if (error.message == 'OVER_QUERY_LIMIT') {
            console.error('We ran into the API limit')       
            return redisClient.hsetAsync('job' + zipBatch.jobId, 'status', 'STALLED_ON_PLACE_API')
            .then(() => new Promise((resolve, reject) => setTimeout(resolve, radarBackoff.next().value)))
            .then(() => processZipMessageAsync(message, placeSet));
        } else {
            console.error(`Error during radar search: ${error.message}`);
            let delay = radarBackoff.next().value;
            console.error(`Trying again in ${delay}ms`);
            return new Promise((resolve, reject) => setTimeout(resolve, delay))
            .then(() => processZipMessageAsync(message, placeSet));
        }                
    })     
}

// Do a radar search for the keyword at the lat and lon given. Returns the parsed response
function radarSearchAsync(region, keyword, agent) {
    return new Promise((resolve, reject) => {
        https.get({
            agent: agent,
            hostname: 'maps.googleapis.com',
            path: `/maps/api/place/radarsearch/json?location=${region.lat},${region.lon}&radius=50000&keyword=${encodeURIComponent(keyword)}&key=${process.env.GOOGLE_API_KEY}`
        }, ((res) => {
            
            let data = ""
            res.on('data', (dat) => data += dat)
            res.on('end', () => {
                let parsedData = JSON.parse(data);
                if (parsedData.status != 'OK' && parsedData.status != 'ZERO_RESULTS') {
                    reject(new Error(parsedData.status));
                } else {
                    resolve(parsedData);
                }
            })
            res.on('error', reject);    
        }));
    });
}

// Enqueue all place ids in batches of the given size
function enqueuePlacesAsync(placeIds, batchSize, jobId) {
    console.log('Queueing up places');
    
    // Don't do anything if we didn't find any places.
    if (placeIds.size == 0) {
        return null;
    }
    
    let placeMessages = [];
    for (let i = 0; i < Math.ceil(placeIds.length / batchSize); i++) {
        placeMessages.push({jobId: jobId, places: []})
    }
    
    for (let i = 0; i < placeIds.length; i++) {
        placeMessages[Math.floor(i / batchSize)].places.push(placeIds[i]);
    }
    
    let enqueuePromises = placeMessages.map((message) => {
        queueService.createMessageAsync(`${process.env.PLACE_QUEUE_NAME}-${jobId}`, JSON.stringify(message));
    })
    return Promise.all(enqueuePromises);
}
