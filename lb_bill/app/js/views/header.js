define(["backbone"],
    function(Backbone) {
      	return Backbone.View.extend({
      		events: {
		      "click .signup-go": "signUp"  
		    },
      		// template: _.template($('#header_template').html()),
		  	initialize: function(){
				
			},
			render: function(){
				var that = this;
				// Compile the template using underscore
				var data_to_passed = "Hello";
				$.get('/templates/header.html', function (data) {
				    template = _.template(data, { data_to_passed : data_to_passed }); 
				    that.$el.html(template); 
				}, 'html');
			},
		    signUp: function( event ){
		      // Button clicked, you can access the element that was clicked with event.currentTarget
		      console.log( "testing" );
    		}
		});
    }
);