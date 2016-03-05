define([
    'jquery',
    'underscore',
    'backbone',
    'router'
    ],
    function($,_,Backbone,Router){

        var Application = {
        initialize: function () {
            var self = this;

            //start the backbone history opbject
            Backbone.history.start();

            $(document).ready(function() {

/*                    $.get(app + "/", function(data)
                    {

                    });*/
            });
        }

        }

        return Application;
    });