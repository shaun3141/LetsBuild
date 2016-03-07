"use strict"

const azure = require('azure-storage');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const express = require('express');
const redis = require('redis');
const sql = require('mssql');
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

let sqlConnection = sql.connect({
	user: process.env.SQL_USER,
	password: process.env.SQL_PASSWORD,
	server: process.env.SQL_SERVER,
	database: process.env.SQL_DATABASE,
	options: {
		encrypt: true
	}
});

let queueService = azure.createQueueService(process.env.AZURE_STORAGE_CONNECTION_STRING);

let app = express();
app.use(bodyParser.json());
app.listen(process.env.port || 1234, () => console.log("Listening..."));


/*
Start off a scrape job and return id or error

Input:
    {
	"region": {
	    "min": {"lat": xxx, "lon": xxx},
	    "max": {"lat": xxx, "lon": xxx}
	},
	"keywords": "yyy"
    }
Output:
    200:
    { "jobId": xxx }
    400/500:
    { "error": xxx }
*/
app.post('/job', (req, res) => {

	// Make sure the body is valid
	if (!isValidBody(req.body)) {
		res.status(400).json({
			error: "Invalid Request Body: " + JSON.stringify(req.body)
		});
		return;
	}
	
    // Submit the job and return the id
    createJobAsync(req.body.region, req.body.keywords)
    .then((jobId) => {
        res.json({
            jobId: jobId
        })
    })
    .catch((error) => {
        res.status(500).json({
            error: error.message
        })
    })
});


// Whether the JSON body is valid
function isValidBody(body) {
	return body
		&& body.region
		&& body.region.min
		&& body.region.min.lat
		&& typeof body.region.min.lat == 'number'
		&& body.region.min.lon
		&& typeof body.region.min.lon == 'number'
		&& body.region.max
		&& body.region.max.lat
		&& typeof body.region.max.lat == 'number'
		&& body.region.max.lon
		&& typeof body.region.max.lon == 'number'
		&& body.keywords
		&& typeof body.keywords == 'string'
}


// Create a job and submit it to the queue
function createJobAsync(region, keywords) {
    // Add the job to the SQL database and generate queues
    return sqlConnection
    .then(() => {
      return new sql.Request().query(`INSERT INTO Jobs (status, min_lat, max_lat, min_lon, max_lon)
                                                OUTPUT INSERTED.id
                                                VALUES ('IN_PROGRESS',
                                                    ${region.min.lat},
                                                    ${region.max.lat},
                                                    ${region.min.lon},
                                                    ${region.max.lon})`);
    })
    .then((results) => {
        let jobId = results[0].id;
        return createQueuesAsync(jobId)
            .then(() => queueZipcodesAsync(jobId, region, keywords))
            .then(() => jobId);
    })
    .catch((error) => {
	throw new Error(`Error creating job: ${error.message}`);
    });
}


// Create the queues for a job
function createQueuesAsync(jobId) {
    return queueService.createQueueIfNotExistsAsync(process.env.AGGREGATOR_QUEUE_NAME)
	.then(() => queueService.createQueueIfNotExistsAsync(`${process.env.PLACE_QUEUE_NAME}-${jobId}`))
	.then(() => queueService.createQueueIfNotExistsAsync(`${process.env.ZIP_QUEUE_NAME}-${jobId}`))
	.catch((error) => {
	    throw new Error(`Error creating queues: ${error.message}`);
	});
}


// Add all zipcodes from a region into the queue and redis
function queueZipcodesAsync(jobId, region, keywords) {
    let req = new sql.Request();
    return req.query(`SELECT zipcode FROM Zipcodes WHERE lat <= ${region.max.lat} AND
							 lat >= ${region.min.lat} AND
							 lon <= ${region.max.lon} AND
							 lon >= ${region.min.lon}`)

    .then((results) => {
        const BATCH_SIZE = 500;
        let zipMessages = batchZipMessages(jobId, keywords, results, BATCH_SIZE);
        let redisPromise = redisClient.hmsetAsync('job' + jobId, { 
            status: 'IN_PROGRESS',
            num_zips: results.length,
            started_zips: 0,
            discovered_places: 0,
            scraped_places: 0,
            emails_found: 0
        });

        let returnPromise = zipMessages.reduce((promise, message) => {
            return promise.then(() => queueService.createMessageAsync(`${process.env.ZIP_QUEUE_NAME}-${jobId}`, JSON.stringify(message)));
        }, redisPromise);

        return returnPromise.catch((error) => {
            throw new Error(`Error submitting zipcodes: ${error.message}`);
        });
    })
}


// Batch a SQL result set of zipcodes into messages
function batchZipMessages(jobId, keywords, resultSet, batchSize) {
    let zipMessages = [];

    for (let i = 0; i < Math.ceil(resultSet.length / batchSize); i++)
	zipMessages.push({jobId: jobId, zips: []});

    for (let i = 0; i < resultSet.length; i++)
	zipMessages[Math.floor(i / batchSize)].zips.push(resultSet[i].Zipcode);

    return zipMessages;
}
