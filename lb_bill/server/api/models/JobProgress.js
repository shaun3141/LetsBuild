/**
* JobProgress.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
    //connection:"job_progress",
    attributes: {
        id:{
            type:"integer",
            required:true
        }
        status:{
            type:"string",
            enum:["ADDING_TO_ZIP_QUEUE",
            "ADDING_TO_PLACE_QUEUE",
            "STALLED_ON_PLACE_API",
            "SCRAPING"],
            required:true
        },
        num_zips:{
            type:"integer",
            required:true
        },
        started_zips:{
            type:"integer",
            required:true
        },
        discovered_places:{
            type:"integer",
            required: true
        },
        scraped_places:{
            type:"integer",
            required:true
        },
        emails_found:{
            type:"integer",
            required:true
        }
    }
};

