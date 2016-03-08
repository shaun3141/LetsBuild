/**
 * Run_activationController
 *
 * @description :: Bill's logic for connecting to charlotte
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var request = require("request");

module.exports = {

  startRun: function(req,res){
    var data = req.body;

    var user_id = "";//get user_id

    request.post({
      url:config.charlotte+"/job",
      form:{
        user_id: user_id,
        region:{
          min:{lat:data.region.min.lat,lon:data.region.min.lon},
          maX:{lat:data.region.max.lat,lon:data.region.max.lon}
        },
        keywords:data.keywords,
        name:data.name,
        description:data.description,
      }
    },function(err,response,body){
      if (err){
        res.send(503,{error:err.error});
        return;
      }

      res.send(200,{success:true,jobId:body.jobId});
    });

  },

  getJob: function(req,res){
    var jobId = req.body.jobId;

  },

  getJobProgress: function(req,res){
    var jobId = req.body.jobId;
  }

};
