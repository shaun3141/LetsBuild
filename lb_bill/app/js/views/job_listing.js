define(["backbone"],
    function(Backbone) {
      	return Backbone.View.extend({
		  	initialize: function(){
				
			},
			render: function(){
				var that = this;
				// Compile the template using underscore
				var data_to_passed = "Hello";
				$.get('/templates/job-listing.html', function (data) {
				    template = _.template(data, { data_to_passed : data_to_passed }); 
				    that.$el.html(template); 
				    return that;
				}, 'html');
				
			}
		});
    }
);