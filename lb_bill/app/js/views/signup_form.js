define(["backbone", 'models/user'],
    function(Backbone, User) {
      	return Backbone.View.extend({
      		el: $('#signup-modal'),
      		events : {
		        "change input" :"changed",
		        "change select" :"changed"
		    },

		    initialize: function () {
		        _.bindAll(this, "changed");
		    },
		    changed:function(evt) {
		       var changed = evt.currentTarget;
		       var value = $(evt.currentTarget).val();
		       var obj = {};
		       obj[changed.id] = value;
		       this.model.set(obj);
		    }
		});
    }
);