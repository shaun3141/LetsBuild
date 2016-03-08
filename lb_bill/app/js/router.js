define(["backbone"],
    function(Backbone) {
    	
      return Backbone.Router.extend({
  		routes: {
   			'': 'home',
    		'jobListing': 'jobListing',
    		'*actions': 'defaultAction'
  		}
    });
});
