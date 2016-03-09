define(["backbone", 'models/user'],
    function(Backbone, User) {
      	return Backbone.View.extend({
      		events: {
		      "click .signup-go": "signUp", 
		      "click .login-go": "login"  
		    },
      		// template: _.template($('#header_template').html()),
		  	initialize: function(){
				
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
				var data = $(event.currentTarget).data();

				var new_user = new User({firstName:"luke",lastName:"geiken", email: "luke.geiken@gmail.com", password:"fake.1234", confirmPassword:"fake.1234"});
				var resp = new_user.save(null, {
				  	type: 'POST'
				});
				console.log(resp);
				this.app_router.navigate('jobListing',true);
		      
    		},
    		login: function( event ){
				// Button clicked, you can access the element that was clicked with event.currentTarget
				console.log("Login");
				var data = $(event.currentTarget).data();
				this.app_router.navigate('jobListing',true);
				//var new_user = new User({firstName:"luke",lastName:"geiken", email: "luke.geiken@gmail.com", password:"fake.1234", confirmPassword:"fake.1234"});
				// var resp = new_user.save(null, {
				//   	type: 'GET'
				// });
				//console.log(resp);
		      
    		}
		});
    }
);