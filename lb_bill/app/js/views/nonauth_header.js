define(["backbone", 'models/user'],
    function(Backbone, User) {
      	return Backbone.View.extend({
      		events: {
		      "click .signup-go": "signUp", 
		      "click .login-go": "login",
		      "change input.content":  "changed"
		    },
		  	initialize: function(){
				_.bindAll(this, 'changed');
				this.new_user_info = {};
			},
			setRouter: function(router) {
				this.app_router = router;
			},
			render: function(){
				var that = this;
				// Compile the template using underscore
				var data_to_passed = "Hello";
				$.get('/templates/nonauth-header.html', function (data) {
				    template = _.template(data, { data_to_passed : data_to_passed }); 
				    that.$el.html(template); 
				}, 'html');
			},
		    signUp: function( event ){
				// Button clicked, you can access the element that was clicked with event.currentTarget
				var data = {firstName:"luke",lastName:"geiken", email: "lgeiken@iastate.edu", password:"Fake.1234", confirmPassword:"Fake.1234"};
				var that = this;
				console.log(this.new_user);
				var created_user = new User(this.new_user);
				var resp = created_user.save(null, {
				  	type: 'POST',
				  	success: function (model, response) {
				  		// Setup user session based on returned model
				  		var responseText = JSON.parse(response.responseText);
				  		console.log(responseText);
				  		// Reroute to the job listing 
						that.app_router.navigate('jobListing',true);
						$('#signup-modal').closeModal();
				    },
				    error: function (model, response) {
				    	var responseText = JSON.parse(response.responseText);
				        console.log(responseText.error);
						
				    }
				});
    		},
    		login: function( event ){
				// Button clicked, you can access the element that was clicked with event.currentTarget
				var data = {email: "lgeiken@iastate.edu", password:"Fake.1234"}
				
				this.app_router.navigate('jobListing',true);
				//var new_user = new User({firstName:"luke",lastName:"geiken", email: "luke.geiken@gmail.com", password:"fake.1234", confirmPassword:"fake.1234"});
				// var resp = new_user.save(null, {
				//   	type: 'GET'
				// });
				//console.log(resp);
		      
    		},	
		    changed: function(evt) {
		       var changed = evt.currentTarget;
		       var value = $(evt.currentTarget).val();
		       this.new_user[changed.id] = value;
		    }
		});
    }
);