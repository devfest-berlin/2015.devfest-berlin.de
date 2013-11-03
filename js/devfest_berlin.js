var devfest = angular.module('gdgBoomerang', ['ngSanitize','ui.bootstrap'])
    .config(function($routeProvider) {
         $routeProvider.
             when("/about",  {templateUrl:'views/about.html', controller:"AboutControl"}).
             when("/news", {templateUrl:'views/news.html', controller:"NewsControl"}).
             when("/events", {templateUrl:'views/events.html', controller:"EventsControl"}).
             when("/photos", {templateUrl:'views/photos.html', controller:"PhotosControl"}).
             when("/contact", {templateUrl:'views/contact.html', controller:"ContactControl"}).
             otherwise({ redirectTo: '/about' });
    });

devfest.factory('Config',function(){
    return {
        'name'          : 'DevFest Berlin',
        'id'            : '116495772997450383126',
        'event_id'      : 'csc1rob3gekqalff7919h0e4qrk', //must be public
        'google_api'    : 'AIzaSyBs64m_HUrQE864HfvEP87y6aqPaOYvmiQ',
        //picasa web album id, must belong to google+ id above
        'pwa_id'        : { "DevFest Berlin 2012": "5940164247434937905",
                            "DevFest Berlin 2013": "5940170057320370689"
        },
        'cover' : {
            title : 'DevFest Berlin',
            subtitle : 'November 1st - 3rd, 2013',
            button : {
                text : 'Get your ticket now',
                url : 'https://berlin.ticketbud.com/devfest-berlin-2013'
            }
        },
        "email"    : 'team@devfest-berlin.de',
        "team_ids" : [
            "117509657298845443204", //ben
            "111820256548303113275", //surma
            "110214177917096895451", //cketti
            "111119798064513732293", //david
            "110167958764078863962", //dirk
            "109673287110815740267", //hasan
            "108253608683408979021", //michael
            "111333123856542807695", //stevie
            "110615325729051596989" //jerome
        ] //must be Google+ profile ids
    }
});

devfest.controller('MainControl', function($scope, Config) {
    $scope.chapter_name = Config.name;
    $scope.google_plus_link = 'https://plus.google.com/' + Config.id;
    $scope.google_plus_event_link = 'https://plus.google.com/events/' + Config.event_id;
    $scope.isNavCollapsed = true;
});

devfest.controller('AboutControl', function( $scope, $http, $location, Config ) {
    $scope.loading = true;
    $scope.$parent.activeTab = "about";
    $scope.cover = Config.cover;
    $http.jsonp('https://www.googleapis.com/plus/v1/people/'+Config.id+'?callback=JSON_CALLBACK&fields=aboutMe%2Ccover%2Cimage%2CplusOneCount&key='+Config.google_api).
        success(function(data){
            $scope.desc = data.aboutMe;
            if(data.cover && data.cover.coverPhoto.url){
                $scope.cover.url = data.cover.coverPhoto.url;
            }
            $scope.loading = false;
        });
});

devfest.controller("NewsControl", function($scope, $http, $timeout, Config) {
    $scope.loading = true;
    $scope.$parent.activeTab = "news";
    $http.
        jsonp('https://www.googleapis.com/plus/v1/people/' + Config.id + '/activities/public?callback=JSON_CALLBACK&maxResults=10&key=' + Config.google_api).
        success(function(response){
            var entries = [];
            for (var i = 0; i < response.items.length; i++) {
                var item = response.items[i];
                var actor = item.actor || {};
                var object = item.object || {};
                // Normalize tweet to a FriendFeed-like entry.
                var item_title = '<b>' + item.title + '</b>';

                var html = [item_title.replace(new RegExp('\n','g'), '<br />')];
                //html.push(' <b>Read More &raquo;</a>');

                var thumbnails = [];

                var attachments = object.attachments || [];
                for (var j = 0; j < attachments.length; j++) {
                    var attachment = attachments[j];
                    switch (attachment.objectType) {
                        case 'album':
                            break;//needs more work
                            var upper = attachment.thumbnails.length > 7 ? 7 : attachment.thumbnails.length;
                            html.push('<ul class="thumbnails">');
                            for(var k=1; k<upper; k++){
                                html.push('<li class="span2"><img src="' + attachment.thumbnails[k].image.url + '" /></li>');
                            }
                            html.push('</ul>');
                            break;
                        case 'photo':
                            thumbnails.push({
                                url: attachment.image.url,
                                link: attachment.fullImage.url
                            });
                            break;

                        case 'video':
                            thumbnails.push({
                                url: attachment.image.url,
                                link: attachment.url
                            });
                            break;

                        case 'article':
                            html.push('<div class="link-attachment"><a href="' +
                                attachment.url + '">' + attachment.displayName + '</a>');
                            if (attachment.content) {
                                html.push('<br>' + attachment.content + '');
                            }
                            html.push('</div>');
                            break;
                        case 'event':
                            html.push('<b>' + attachment.displayName + '</b>');
                            html.push('<p>' + attachment.content.replace(new RegExp('\n','g'), '<br />') + '</p>');
                            break;
                    }
                }

                html = html.join('');

                var actor_image = actor.image.url;
                actor_image = actor_image.substr(0,actor_image.length-2)+'16';

                var entry = {
                    via: {
                        name: 'Google+',
                        url: item.url
                    },
                    body: html,
                    date: item.updated,
                    reshares: (object.resharers || {}).totalItems,
                    plusones: (object.plusoners || {}).totalItems,
                    comments: (object.replies || {}).totalItems,
                    thumbnails: thumbnails,
                    icon: actor_image
                };

                entries.push(entry);
            }
            $scope.news = entries;
            $timeout(function(){
                gapi.plusone.go();
            });
            $scope.loading = false;
        });

});

devfest.controller("EventsControl", function( $scope, $http, Config ) {
    $scope.loading = true;
    $scope.$parent.activeTab = "events";

    $scope.events = {past:[] ,future:[]};
    $http.get("http://gdgfresno.com/gdgfeed.php?id="+Config.id).
        success(function(data){
            var now = new Date();
            for(var i=data.length-1;i>=0;i--){
                var start = new Date(data[i].start);

                data[i].start = start;
                data[i].end = new Date(data[i].end);

                if (start < now){
                    $scope.events.past.push(data[i]);
                } else {
                    $scope.events.future.push(data[i]);
                }
            }
            $scope.loading = false;
        });
});

devfest.controller("PhotosControl", function( $scope, $http, Config ) {
    $scope.loading = true;
    $scope.$parent.activeTab = "photos";
    $scope.photos = {};


    angular.forEach(Config.pwa_id, function(albumId, key){

        var pwa = 'https://picasaweb.google.com/data/feed/api/user/'+Config.id+'/albumid/'+albumId+'?access=public&alt=json-in-script&kind=photo&max-results=20&fields=entry(title,link/@href,summary,content/@src)&v=2.0&callback=JSON_CALLBACK';

        $scope.photos[key] = []

        $http.jsonp(pwa).
            success(function(d){
                var p = d.feed.entry;
                for(var x in p){
                    var photo = {
                        link : p[x].link[1].href,
                        src : p[x].content.src,
                        alt : p[x].title.$t,
                        title : p[x].summary.$t
                    };
                    $scope.photos[key].push(photo);
                }
                $scope.loading = false;
            });

    });
});

devfest.controller('ContactControl', function($scope, $http, $timeout, Config) {
    $scope.$parent.activeTab = "contact";

    $scope.email = Config.email;
    $scope.google_plus_link = 'https://plus.google.com/' + Config.id + '/about';
    $scope.team = [];

    angular.forEach(Config.team_ids, function(teamId, index){

        $timeout(function () {

            var gplusUrl = "https://www.googleapis.com/plus/v1/people/"+teamId+"?callback=JSON_CALLBACK&fields=displayName%2Cid%2Cimage%2Curl&key="+Config.google_api;

            $http.jsonp(gplusUrl).
                success(function(member){

                        member.image.url = member.image.url.replace('?sz=50','?sz=200');
                        $scope.team.push(member);
                })

        }, (index + 1) * 200);
    });

    $scope.loading = false;
    $scope.isNavCollapsed = true;
});