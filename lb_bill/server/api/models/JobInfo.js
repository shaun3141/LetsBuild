/**
* JobInfo.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
    //connection:"job_persistent",
    tableName:"Jobs",
    attributes: {
        id:{
            type:"integer",
            required:true,
            primaryKey: true
        },
        user_id:{
            type:"string",
            required:true
        },
        min_lat:{
            type:"float",
            required:true
        },
        min_lon:{
            type:"float",
            required:true
        },
        max_lat:{
            type:"float",
            required:true
        },
        max_long:{
            type:"float",
            required:true
        },
        status:{
            type:"string",
            enum:["ADDING_TO_ZIP_QUEUE",
            "ADDING_TO_PLACE_QUEUE",
            "STALLED_ON_PLACE_API",
            "SCRAPING"],
            required:true
        },
        keywords:{
            type:"string",
            required:true
        },
        name:{
            type:"string",
            required:false
        },
        description:{
            type:"text",
            required:false
        }
    }
};

