/**
 * JobProgressController
 *
 * @description :: Bill's logic for connecting to charlotte
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var request = require("request");
var redis = require("redis");

module.exports = {
    getJob:function(req,res){
        var jobId = "job"+req.params.jobId;
        var client = redis.createClient(6379,"letsbuild.redis.cache.windows.net",{password:"guL+z01QuX5bj8g3NWjFpzFUrMP20cifkzbG7HtsIHs="});

        client.hgetall(jobId, function (error, status) {
            if (error){
                console.log(error);
                res.json({success:false,error:error});
                return;
            }

            res.json({data:status});
        });
    },
    getJobIds:function(req,res){

        JobInfo.query("SELECT id from Jobs",function(err,results){
            if (err){
                res.json({success:false,error:err});
                return;
            }

            var names = []
            for (i=0;i<results.length;i++){
                names.push(results[i].id);
            }

            res.json({success:true,data:names});
        });
    }
};