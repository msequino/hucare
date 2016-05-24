(function () {
    'use strict';

    angular
        .module('app', ['ngRoute', 'ngCookies','ja.qr'])
        .config(config)
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider'];
    function config($routeProvider, $locationProvider, $compileProvider) {
      $routeProvider
        .when('/', {
            controller: 'HomeController',
            templateUrl: 'components/home/homeView.html',
            controllerAs: 'vm',
        })

        .when('/login', {
            controller: 'UserController',
            templateUrl: 'components/user/userView.html',
            controllerAs: 'vm'
        })

        .otherwise({ redirectTo: '/login' });
    }

    run.$inject = ['$rootScope', '$location', '$cookieStore', '$http'];
    function run($rootScope, $location, $cookieStore, $http) {
        // keep user logged in after page refresh
        $rootScope.globals = $cookieStore.get('globals') || {};
        if ($rootScope.globals.currentUser) {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
        }

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            var restrictedPage = $.inArray($location.path(), ['/login']) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if (restrictedPage){
              if(!loggedIn) $location.path('/login');
              else $location.path('/');
            }
            else
            {
              if(loggedIn) $location.path('/');
            }
        });
    }

})();
