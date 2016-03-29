define(["backbone", 'models/user'],
    function(Backbone, User) {
      	return Backbone.View.extend({
      		events: {
		      "click .change-password": "changePassword",
		      "click .paypal-purchase": "paypalPurchase",
		      "click .create-new-job": "createNewJob",
		    },
      		// template: _.template($('#header_template').html()),
		  	initialize: function(){
				
			},
			setRootScope: function(router, main_user) {
				this.app_router = router;
				this.main_user = main_user;
			},
			render: function(){
				var that = this;
				// Compile the template using underscore
				var data_to_passed = "Hello";
				console.log(this.main_user.get("email"));
				$.get('/templates/auth-header.html', function (data) {
				    var template = _.template(data);
				    var html =  template({ email : that.main_user.get("email") } );
				    that.$el.html(html); 
				}, 'html');
			},
			changePassword: function(){
				var that = this;
			

				$.ajax({
				  type: "POST",
				  url: "http://localhost:1337/user/send_reset",
				  data: {email: this.main_user.get("email")},
				  success: function(msg){
				  		console.log("Success: " + msg);
				        Materialize.toast("<span>Sent email to your inbox to change your password</span>", 2000, 'dialog');
				  },
				  error: function(XMLHttpRequest, textStatus, errorThrown) {
				  		console.log("Error: " + errorThrown);
				     	Materialize.toast("<span>Could not send email, contact website support</span>", 2000, 'dialog');
				  },
				  dataType: "json"
				});
			},
			paypalPurchase: function(){
				var that = this;
				Materialize.toast("Send user to paypal to complete payment", 2000, 'dialog');
			},
			createNewJob: function(){
				var that = this;
				Materialize.toast("Start a new job", 2000, 'dialog');
			},
			
		});
    }
);