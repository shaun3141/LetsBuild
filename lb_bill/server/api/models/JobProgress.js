/**
* JobProgress.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
    connection:"job_progress",
    attributes: {
        status:{
            type:"string",
            enum:["ADDING_TO_ZIP_QUEUE",
            "ADDING_TO_PLACE_QUEUE",
            "STALLED_ON_PLACE_API",
            "SCRAPING"]
        },
        num_zips:{
            type:"integer"
        },
        started_zips:{
            type:"integer"
        },
        discovered_places:{
            type:"integer"
        },
        scraped_places:{
            type:"integer"
        },
        emails_found:{
            type:"integer"
        }
    }
};

