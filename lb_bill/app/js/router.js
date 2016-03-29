define(["backbone"],
    function(Backbone) {
    	
      return Backbone.Router.extend({
    		routes: {
     			'': 'home',
      		'jobListing': 'jobListing',
          'logout': 'logout', 
      		'*actions': 'defaultAction'
    		},
        initialize: function(){
          this.isAuthorized = false;
        },
        setAuthorized: function(bool) {
          this.isAuthorized = bool;
        },
        getAuthorized: function() {
          return this.isAuthorized;
        }
    });
});
