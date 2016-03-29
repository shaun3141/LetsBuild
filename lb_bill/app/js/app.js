define([
    'jquery',
    'underscore',
    'backbone',
    'router',
    'models/user',
    'models/login_user',
    'views/nonauth_header',
    'views/auth_header',
    'views/home',
    'views/job_listing'
    ],
    function($,_,Backbone, Router, User, Login_User, NonAuthHeader, AuthHeader, Home, JobListing){

        var nonauth_header_view = new NonAuthHeader({el: $("#header_container")});
        var auth_header_view = new AuthHeader({el: $("#header_container")});
        var home_view = new Home({el: $("#content_container")});
        var joblisting_view = new JobListing({el: $("#content_container")});

        var Application = {
            initialize: function () {
                var self = this;
                var main_user = new User();
                var app_router = new Router;

                nonauth_header_view.setRootScope(app_router, main_user);
                auth_header_view.setRootScope(app_router, main_user);
                home_view.setRootScope(app_router, main_user);
                joblisting_view.setRootScope(app_router, main_user);

                app_router.on('route:home', function(){
                    if(app_router.getAuthorized()) auth_header_view.render();
                    else nonauth_header_view.render();
                    
                    home_view.render();
                    
                });

                app_router.on('route:jobListing', function(actions){
                    if(app_router.getAuthorized()) 
                    {
                        auth_header_view.render();
                        joblisting_view.render();
                    }
                    else
                    {
                        nonauth_header_view.render();
                        app_router.navigate('',true);
                    } 
                });

                app_router.on('route:logout ', function(actions){
                    // ----------------------------------------------------------------------
                    // Set authorized to false and remove login token from client side storage
                    // ----------------------------------------------------------------------
                    if(app_router.getAuthorized()) app_router.setAuthorized(false);

                    main_user = new User();
                    nonauth_header_view.render();
                    app_router.navigate('',true);
                });

                app_router.on('route:defaultAction', function(actions){
                    nonauth_header_view.render();
                    app_router.navigate('',true);
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
