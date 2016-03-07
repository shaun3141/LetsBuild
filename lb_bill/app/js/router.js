define(["backbone"],
    function(Backbone) {
      return Backbone.Router.extend({
  		routes: {
   			"/": "home",
    		"/job-listing": "jobListing"
  		},

		home: function(){
			var homeView = new Backbone.View.Home();
    		console.log("lksdjf");
		},

		jobListing: function(){
			//var jobList = new JobListingView();
			
		},

		initialize: function(options) {
			
        }
    });
});
