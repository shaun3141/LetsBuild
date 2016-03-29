define(["backbone"],
    function(Backbone) {
      	return Backbone.Model.extend({
	  		urlRoot: 'http://localhost:1337/user/login',
	        defaults: {
	            email: "",
	            password: ""
	        },
	        validate: function( object ){

	        },
	        initialize: function(){
	            
	        }
	    });
    }
);