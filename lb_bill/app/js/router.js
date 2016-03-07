define(["backbone"],
    function(Backbone) {
    	var homeView;
    	var jobListingView;
      return Backbone.Router.extend({
  		routes: {
   			"": "home",
    		"/jobListing": "jobListing"
  		},

		home: function(){
    		console.log("awieuqoew");
    		homeView.render();
		},

		jobListing: function(){
			console.log("lksdjhfksjdf");
			jobListing.render();
		},

		initialize: function(home, jobListing) {
			homeView=home;
			jobListingView=jobListing;
        }
    });
});
