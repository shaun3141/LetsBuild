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
				$.get('/templates/auth-header.html', function (data) {
				    template = _.template(data, { data_to_passed : data_to_passed }); 
				    that.$el.html(template); 
				}, 'html');
			}
		});
    }
);