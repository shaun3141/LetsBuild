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

let sqlConnection = sql.connect({
	user: process.env.SQL_USER,
	password: process.env.SQL_PASSWORD,
	server: process.env.SQL_SERVER,
	database: process.env.SQL_DATABASE,
	options: {
		encrypt: true
	}
});

let queueService = azure.createQueueService();

let app = express();
app.use(bodyParser.json());

/*
Start off a scrape job
Expect the body to be:

{
	"region": {
		"min": {lat: xxx, lon: xxx},
		"max": {lat:xxx, lon:xxx}},
	"keywords": "yyy"
}

*/
app.post('/job', (req, res) => {
	// Make sure the body is valid
	if (!isValidBody(req.body)) {
		res.status(400).json({
			error: "Invalid Request Body: " + JSON.stringify(req.body)
		});
		return;
	}
	
	let jobId = null;
	
	redisClient
		.incrAsync('job:id')
		.then((res) => {
			jobId = res;
			return redisClient.hmsetAsync('job' + jobId, {status: 'new'});
		})
		.then(() => queueService.createQueueIfNotExistsAsync(process.env.JOB_QUEUE_NAME))
		.then(() => queueService.createQueueIfNotExistsAsync(process.env.ZIP_QUEUE_NAME))
		.then(() => sqlConnection)
		// We already know the lats and lons are valid
		.then(() => new sql.Request().query(`SELECT Zipcode FROM zipcodes WHERE 
																Lat <= ${req.body.region.max.lat} AND
																Lat >= ${req.body.region.min.lat} AND
																Lng <= ${req.body.region.max.lon} AND
																Lng >= ${req.body.region.min.lon}`))
		.then((results) => {
			const BATCH_SIZE = 500;
			let zipMessages = [];
            for (let i = 0; i < Math.ceil(results.length / BATCH_SIZE); i++) {
                zipMessages.push({jobId: jobId, zips: []});
            }
            
			for (let i = 0; i < results.length; i++) {
				zipMessages[Math.floor(i / BATCH_SIZE)].zips.push(results[i].Zipcode);
			}							
			let ret = redisClient.hmsetAsync('job' + jobId, {num_zips: results.length, started_zips: 0});

			// Oh god...
			zipMessages.forEach((zipMessage) => {
				ret = ret.then(() => queueService.createMessageAsync(process.env.ZIP_QUEUE_NAME, JSON.stringify(zipMessage)))
			});
			
			return ret;
		})
		.then(() => queueService.createMessageAsync(process.env.JOB_QUEUE_NAME, jobId))
		.then(() => {
			res.json({
				jobId: 	jobId
			})	
		})
		.catch((error) => {
			res.status(500).json({
				error: error.message
			})
		})
	
});

app.listen(process.env.port || 1234, () => console.log("Listening..."));

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