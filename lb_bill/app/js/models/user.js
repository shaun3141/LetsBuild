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
	        validate: function( object ){
	        	// if(firstName==null || lastName==null || email==null || password==null || confirmPassword==null ) {
	        	// 	return {error: "You have an invalid first and last name"};
	        	// }
	         //    if(firstName == "" || lastName == "" ){
	         //        return {error: "You have an invalid first and last name"};
	         //    }
	         //    if(password == confirmPassword ){
	         //        return {error: "Your passwords do not match"};
	         //    }
	         //    if( /(.+)@(.+){2,}\.(.+){2,}/.test(email) ){
	         //        return {error: "Your email is invalid"};
	         //    }
	         //     return {status: "New user is valid"};
	        },
	        initialize: function(){
	            
	        }
	    });
    }
);