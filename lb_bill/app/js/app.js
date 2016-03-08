define([
    'jquery',
    'underscore',
    'backbone',
    'router',
    'models/users',
    'views/header',
    'views/home',
    'views/job_listing',
    ],
    function($,_,Backbone, Router, User, Header, Home, JobListing){
        var headerview = new Header({el: $("#header_container")});
        var homeview = new Home({el: $("#content_container")});
        var joblistingview = new JobListing({el: $("#content_container")});
        var Application = {
            initialize: function () {
                var self = this;

                var app_router = new Router;

                app_router.on('route:home', function(){
                    headerview.render();
                    homeview.render();
                    
                });

                app_router.on('route:jobListing', function(actions){
                    headerview.render();
                    joblistingview.render();
                });

                app_router.on('route:defaultAction', function(actions){
                    // We have no matching route, lets just log what the URL was
                    console.log('No route:', actions);
                    app_router.navigate('', true);
                });

                //start the backbone history opbject
                Backbone.history.start();

                $(document).ready(function() {           
                    
                });

                return app_router;
            }
        }

        return Application;
    });
