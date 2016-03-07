define([
    'jquery',
    'underscore',
    'backbone',
    'router',
    'models/users',
    'views/home',
    'views/job_listing'
    ],
    function($,_,Backbone,Router, User, Home, JobListing){
        var homeview = new Home({ el: $("#home_container") });
        var joblistingview = new JobListing({ el: $("#job_listing_container") });
        var router = new Router(homeview, joblistingview);
        var Application = {
            initialize: function () {
                var self = this;

                //start the backbone history opbject
                Backbone.history.start();

                $(document).ready(function() {           

                    homeview.render();
                });
            }
        }

        return Application;
    });
$(document).ready(function(){
    $('.modal-trigger').leanModal();
});