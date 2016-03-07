define(["backbone"],
    function(Backbone) {
      	return Backbone.View.extend({
		  	initialize: function(){
				
			},
			render: function(){
				// Compile the template using underscore
				var template = _.template( $("#job_listing_template").html(), {} );
				// Load the compiled HTML into the Backbone "el"
				this.$el.html( template );
				
			}
		});
    }
);
$(document).ready(function(){
    
});