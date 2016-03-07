define([
    'jquery',
    'underscore',
    'backbone',
    'router'
    ],
    function($,_,Backbone,Router, User){
        
        var Application = {
            initialize: function () {
                var self = this;

                //start the backbone history opbject
                Backbone.history.start();

                $(document).ready(function() {           

                    // $.get(app + "/", function(data){
                    //      console.log("lksdjflk");
                    // });
                });

                // router.on('route:home', function() {
                //   // render user list
                //   userListView.render();
                // });
            }
        }

        return Application;
    });

$(document).ready(function(){
    $('.parallax').parallax();
    $('.modal-trigger').leanModal();
});