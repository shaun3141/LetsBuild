define([
    'jquery',
    'underscore',
    'backbone',
    'router',
    'models/user',
    'views/nonauth_header',
    'views/auth_header',
    'views/home',
    'views/job_listing',
    ],
    function($,_,Backbone, Router, User, NonAuthHeader, AuthHeader, Home, JobListing){
        var nonauth_header_view = new NonAuthHeader({el: $("#header_container")});
        var auth_header_view = new AuthHeader({el: $("#header_container")});
        var home_view = new Home({el: $("#content_container")});
        var joblisting_view = new JobListing({el: $("#content_container")});

        var Application = {
            initialize: function () {
                var self = this;

                var app_router = new Router;

                nonauth_header_view.setRouter(app_router);
                auth_header_view.setRouter(app_router);
                home_view.setRouter(app_router);
                joblisting_view.setRouter(app_router);

                app_router.on('route:home', function(){
                    nonauth_header_view.render();
                    //auth_header_view.render();
                    home_view.render();
                    
                });

                app_router.on('route:jobListing', function(actions){
                    nonauth_header_view.render();
                    //auth_header_view.render();
                    joblisting_view.render();
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
