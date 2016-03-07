define(["backbone"],
    function(Backbone) {
      	return Backbone.Model.extend({
	  		urlRoot: 'http://localhost:1337/user/create',
	        defaults: {
	            firstName: "",
	            lastName: "",
	            email: "",
	            password: "",
	            confirmPassword: ""
	        },
	        validate: function( attributes ){
	            if(attributes.firstName == "" || attributes.lastName == "" ){
	                return "You have an invalid first and last name";
	            }
	            if(attributes.password == attributes.confirmPassword ){
	                return "Your passwords do not match";
	            }
	            if( /(.+)@(.+){2,}\.(.+){2,}/.test(email) ){
	                return "Your email is invalid";
	            }
	        },
	        initialize: function(){
	            console.log("New User Has Asked To Be Created");
	        }
	    });
    });
});