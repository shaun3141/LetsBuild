define(["backbone", 'models/user', 'models/login_user'],
    function(Backbone, User, Login_User) {
      	return Backbone.View.extend({
      		events: {
		      "click .signup-go": "signUp", 
		      "click .login-go": "login",
		      "change input.signup-content":  "updateSignup",
		      "change input.login-content":  "updateLogin"
		    },
		  	initialize: function(){
				_.bindAll(this, 'updateSignup');
				_.bindAll(this, 'updateLogin');
				this.new_user = new User();
				this.login_user = new Login_User();
			},
			setRootScope: function(router, main_user) {
				this.app_router = router;
				this.main_user = main_user;
			},
			render: function(){
				var that = this;
				// Compile the template using underscore
				$.get('/templates/nonauth-header.html', function (data) {
				    var template = _.template(data);
				    var html =  template({ foo : "bar" } );
				    that.$el.html(html); 
				}, 'html');
			},
		    signUp: function( event ){
				// Button clicked, you can access the element that was clicked with event.currentTarget
				//var data = {firstName:"luke",lastName:"geiken", email: "lgeiken@iastate.edu+", password:"Fake.1234", confirmPassword:"Fake.1234"};
				var that = this;
				
				var created_user = new User();
				created_user.save(this.new_user, {
				  	type: 'POST',
				  	success: function (model, response) {
				  		// Setup user session based on returned model
				  		//var responseText = JSON.parse(response.responseText);
				  		//this.main_user = created_user;
				  		// Reroute to the job listing
				  		that.main_user.set(response.model);
				  		that.app_router.setAuthorized(true);
						that.app_router.navigate('jobListing',true);
						$('#signup-modal').closeModal();
				    },
				    error: function (model, response) {
				    	var responseText = JSON.parse(response.responseText);
				        window.alert(responseText.error);
						
				    }
				});
    		},
    		login: function( event ){
				var that = this;
				
				var new_login_user = new Login_User();
				var resp = new_login_user.save(this.login_user, {
				  	type: 'POST',
				  	success: function (model, response) {
				  		//console.log(JSON.stringify(model));
				  		//console.log(JSON.stringify(response));
				  		that.main_user.set(that.login_user.attributes);
				  		that.app_router.setAuthorized(true);
						that.app_router.navigate('jobListing',true);
						$('#login-modal').closeModal();
				    },
				    error: function (model, response) {
				    	var responseText = JSON.parse(response.responseText);
				        window.alert(responseText.error);
						
				    }
				});
		      
    		},	
		    updateSignup: function(evt) {
		       var change_id = evt.currentTarget.id;
		       var value = $(evt.currentTarget).val();
		       var data = {};
		       data[change_id] = value;
		       this.new_user.set(data);
		    },

		    updateLogin: function(evt) {
		       var change_id = evt.currentTarget.id;
		       var value = $(evt.currentTarget).val();
		       var data = {};
		       data[change_id] = value;
		       this.login_user.set(data);
		    }
		});
    }
);