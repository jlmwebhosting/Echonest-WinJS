(function () {
    "use strict";

    var myapp = angular.module('ha', [])
    .service("WinJSApp", function ($rootScope) {
        WinJS.Binding.optimizeBindingReferences = true;
        return WinJS.Application;
    })
    .service("WinJSEventChannel", function ($rootScope, WinJSApp, WinJSSession) {
        
        var SUSPEND_EVENT = "__winjs:suspend";
        var START_EVENT = "__winjs:start";
        var RESUME_EVENT = "__winjs:resume";
        var UI_LOADED = "__winjs:uiloaded";
        var ACTIVATED_EVENT = "__winjs:activated";

        var activation = Windows.ApplicationModel.Activation;

        WinJSApp.onactivated = function (args) {
            if (args.detail.kind === activation.ActivationKind.launch) {
                if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                    $rootScope.$broadcast(START_EVENT, args);
                } else {
                    $rootScope.$broadcast(RESUME_EVENT, args);
                }
                args.setPromise(WinJS.UI.processAll().then(function () {
                    $rootScope.$broadcast(UI_LOADED);
                }));

                $rootScope.$broadcast(ACTIVATED_EVENT, args);
            }
        };

        WinJSApp.addEventListener("checkpoint", function (args) {
            WinJSSession.message = "checkpoint";
            console.log("checkpoint");
            $rootScope.$broadcast(SUSPEND_EVENT, args);
        });
        WinJSApp.start();
        
        var onResume = function (handler) {
            $rootScope.$on(RESUME_EVENT, function (e, args) {
                handler(args);
            });
        };

        var onSuspend = function ( handler) {
            $rootScope.$on(SUSPEND_EVENT, function (e, args) {
                handler(args);
            });
        };

        var onUiLoaded = function (handler) {
            $rootScope.$on(UI_LOADED, function (e) {
                handler();
            });
        };

        var onStart = function (handler) {
            $rootScope.$on(START_EVENT, function (e, args) {
                handler(args);
            });
        };

        return {
            onStart: onStart,
            onSuspend: onSuspend,
            onResume: onResume
        };
    })
    .service("WinJSSession", function (WinJSApp) {
        var appdata = Windows.Storage.ApplicationData.Current.localsettings;
        
        return appdata;
    }).
    service("EchoNest", function (WinJSApp, $http, $q) {
        var BASE_URI = "http://developer.echonest.com/api/v4";
        var STANDARD_PARAMS = {
            api_key: "FILDTEOIK2HBORODV",
            format: "json",
            bucket: ["audio_summary", "tracks", "id:7digital-US", "artist_location"]
        };

        var getSong = function (params) {
            return _get(BASE_URI + "/song/search", params);
        };

        var _get = function (url, params) {
            params = angular.extend(params, STANDARD_PARAMS);
            return $http({
                url: url + "?" + jQuery.param(params, true),
                method: "GET"
            });
        };

        return {
            getSong: getSong,
        };
    })
    .controller("Main", function($scope, $rootScope, EchoNest, WinJSEventChannel, WinJSSession, $location) {
        $scope.results = {};
        $scope.q = "";
        $scope.thesong = {};

        $scope.searchSong = function () {
            EchoNest.getSong({ combined: $scope.q }).success(function (data) {
                $scope.results = data;
            }).error(function (data, status) {
                var alert = Windows.UI.Popups.MessageDialog("Something died :(");
                alert.showAsync();
            });
        };

        $scope.selectSong = function (song) {
            $scope.thesong._selected = false;
            song._selected = true;
            $scope.thesong = song;
        };

        WinJSEventChannel.onStart(function (a) {
            console.log("App Loaded!");

        });

    });


    
})();
