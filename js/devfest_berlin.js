var DEFAULT_YEAR="2013";

var devfest = angular.module('devfest', ['ngRoute','ngSanitize', 'ui.bootstrap'])
    .config(function($routeProvider) {
        $routeProvider.
            when("/:year/about",     {templateUrl:'views/about.html', controller:"AboutControl"}).
            when("/:year/agenda",    {templateUrl:'views/agenda.html', controller:"AgendaControl"}).
            when("/:year/photos",    {templateUrl:'views/photos.html', controller:"PhotosControl"}).
            when("/:year/team",      {templateUrl:'views/team.html', controller:"TeamControl"}).
            when("/:year/news",      {templateUrl:'views/news.html', controller:"NewsControl"}).
            when("/contact",         {templateUrl:'views/contact.html', controller:"ContactControl"}).
            otherwise({ redirectTo: '/'+DEFAULT_YEAR+'/about' }); //FIXME how to use the config object here?
    });

devfest.factory('Config',function(){
    return {
        'name'                  : 'DevFest Berlin',
        'google_plus_page_id'   : '116495772997450383126',
        'google_api'            : 'AIzaSyBs64m_HUrQE864HfvEP87y6aqPaOYvmiQ',
        'default_year'          : DEFAULT_YEAR, //picks from the years object if none is defined in the url
        "email"                 : 'team@devfest-berlin.de',
        'pwa_id'                : {
            "DevFest Berlin 2012": "5940164247434937905",
            "DevFest Berlin 2013": "5940170057320370689"
        },
        'years': {
            '2013': {
                'dates': {
                    'workshops'     : '2013-11-01',
                    'conference'    : '2013-11-02',
                    'hackathon'     : '2013-11-03'
                },
                'google_plus_event_id'  : 'csc1rob3gekqalff7919h0e4qrk', //must be public
                'picasa_album_id'       : "5940170057320370689", //picasa web album id, must belong to google+ page id above
                'cover' : {
                    title : 'DevFest Berlin',
                    subtitle : 'November 1st - 3rd, 2013',
                    button : {
                        text : 'Event is over',
                        url : 'https://berlin.ticketbud.com/devfest-berlin-2013',
                        disabled: true
                    }
                },
                "team_ids" : [ //must be Google+ profile ids
                    "117509657298845443204", //ben
                    "111820256548303113275", //surma
                    "110214177917096895451", //cketti
                    "111119798064513732293", //david
                    "110167958764078863962", //dirk
                    "109673287110815740267", //hasan
                    "108253608683408979021", //michael
                    "111333123856542807695", //stevie
                    "110615325729051596989" //jerome
                ],
                "sponsor_contacts" : [
                    "117509657298845443204", //ben
                    "111119798064513732293", //david
                    "111333123856542807695" //stevie
                ]
            }
        }
    }
});

devfest.controller('MainControl', function($scope, Config) {

    $scope.year = Config.default_year;
    $scope.site_name = Config.name;
    $scope.google_plus_link = 'https://plus.google.com/' + Config.google_plus_page_id;
    $scope.google_plus_event_link = 'https://plus.google.com/events/' + Config.years[$scope.year].google_plus_event_id;
    $scope.isCollapse = true;
    $scope.default_year = Config.default_year;
});

devfest.controller('AboutControl', function( $scope, $http, $location, $routeParams, Config ) {

    var year = $routeParams.year;
    $scope.$parent.year = year; //make sure the main controller knows about the year from the url

    $scope.loading = true;
    $scope.$parent.activeTab = "about";
    $scope.cover = Config.years[year].cover;
    $scope.dates = Config.years[year].dates;

    $http.jsonp('https://www.googleapis.com/plus/v1/people/'+Config.google_plus_page_id+'?callback=JSON_CALLBACK&fields=aboutMe%2Ccover%2Cimage%2CplusOneCount&key='+Config.google_api).
        success(function(data){
            $scope.desc = data.aboutMe;
            if(data.cover && data.cover.coverPhoto.url){
                $scope.cover.url = data.cover.coverPhoto.url;
            }
            $scope.loading = false;
        });
});

devfest.controller("NewsControl", function($scope, $routeParams, $http, $timeout, Config) {

    $scope.loading = true;

    $scope.$parent.activeTab = "news";
    $scope.$parent.year = $routeParams.year; //make sure the main controller knows about the year from the url

    $http.
        jsonp('https://www.googleapis.com/plus/v1/people/' + Config.google_plus_page_id + '/activities/public?callback=JSON_CALLBACK&maxResults=10&key=' + Config.google_api).
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
                                html.push('<li class="col-md-2"><img src="' + attachment.thumbnails[k].image.url + '" /></li>');
                            }
                            html.push('</ul>');
                            break;
                        case 'photo':
                            console.log(attachment);
                            thumbnails.push({
                                url: attachment.url,
                                link: attachment.image.url
                            });
                            break;

                        case 'video':
                            thumbnails.push({
                                url: attachment.url,
                                link: attachment.image.url
                            });
                            html.push(attachment.displayName);
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
                actor_image = actor_image.substr(0,actor_image.length-2)+'50';

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

                console.log(entry);
                entries.push(entry);
            }
            $scope.news = entries;
            $timeout(function(){
                gapi.plusone.go();
            });
            $scope.loading = false;
        });

});

devfest.controller("PhotosControl", function( $scope, $routeParams, $http, Config ) {

    var year = $routeParams.year;
    var picasa_album_id = Config.years[year].picasa_album_id;

    $scope.loading = true;
    $scope.$parent.year = year; //make sure the main controller knows about the year from the url
    $scope.$parent.activeTab = "photos";
    $scope.title = "Photos of DevFest Berlin "+year;

    $scope.album_link = "http://picasaweb.google.com/user/"+Config.google_plus_page_id+"/"+picasa_album_id;
    $scope.photos = {};

    var pwa = 'https://picasaweb.google.com/data/feed/api/user/'+Config.google_plus_page_id+'/albumid/'+picasa_album_id+'?access=public&alt=json-in-script&kind=photo&max-results=20&fields=entry(title,link/@href,summary,content/@src)&v=2.0&callback=JSON_CALLBACK';

    $scope.photos = []

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
                $scope.photos.push(photo);
            }
            $scope.loading = false;
        });
});

devfest.controller('ContactControl', function($scope, $routeParams, $http, $timeout, Config) {

    var year = $routeParams.year | Config.default_year;
    $scope.$parent.year = year; //make sure the main controller knows about the year from the url
    $scope.$parent.activeTab = "contact";

    $scope.email = Config.email;
    $scope.google_plus_link = $scope.$parent.google_plus_link;

    $scope.team = [];
    var team_ids = Config.years[year].sponsor_contacts;
    $scope.shuffle = function(o){ //v1.0
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    };

    team_ids = $scope.shuffle(team_ids);

    angular.forEach(team_ids, function(teamId, index){

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
});


devfest.controller('TeamControl', function($scope, $routeParams, $http, $timeout, Config) {

    var year = $routeParams.year;

    $scope.$parent.year = year; //make sure the main controller knows about the year from the url
    $scope.year = year; //make sure the main controller knows about the year from the url
    $scope.$parent.activeTab = "team";

    $scope.team = [];
    var team_ids = Config.years[year].team_ids;
    $scope.shuffle = function(o){ //v1.0
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    };

    team_ids = $scope.shuffle(team_ids);

    angular.forEach(team_ids, function(teamId, index){

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
});

devfest.controller('AgendaControl', function($scope, $routeParams, $http, Config) {

    var year = $routeParams.year;

    $scope.$parent.year = year; //make sure the main controller knows about the year from the url
    $scope.$parent.activeTab = "agenda";

    $http.get('/data/'+year+'/agenda.json').then(
        function(result){
            var agenda = result.data;

            angular.forEach(agenda.days, function(day){

                var slots ={};

                angular.forEach(day.slots, function(slot){
                    slot.time_start = new Date(day.date + ' ' + slot.time_start);
                    slot.time_end = new Date(day.date + ' ' + slot.time_end);

                    if(! slots.hasOwnProperty(slot.time_start.toString())){
                        slots[slot.time_start.toString()] = [];
                    }

                    slots[slot.time_start.toString()].push(slot);

                    var speakers = [];
                    angular.forEach(slot.speaker_ids, function(id){
                        speakers.push(agenda.speakers[id]);
                    });

                    slot.speakers = speakers;
                    slot.room = agenda.rooms[slot.room_id];
                });

                day.slots = slots;
            });
            $scope.days = agenda.days;

            $scope.loading = false;
        },
        function(error){
            console.log(error);
        }
    );


});
