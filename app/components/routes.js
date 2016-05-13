// Code goes here
'use strict';

var app = angular.module('cartella_anest');

/*var onlyLoggedIn = function ($location,$q,AuthenticationService) {
    var deferred = $q.defer();

    if (AuthenticationService.isLogin()) {
        deferred.resolve();
    } else {
        deferred.reject();
        $location.url('/login');
    }
    return deferred.promise;
};*/

app.config(function($routeProvider){
  $routeProvider.when('/', {
    controller: 'userController',
    templateUrl: 'components/user/userView.html'
  }).when('/index', {
    controller: 'homeController',
    templateUrl: 'components/home/homeView.html',
//    resolve: { loggedin: function(callback) }
  }).otherwise({
    redirectTo : "/"
  })
});

var controllers = {};
controllers.userController = function($scope, $location,$http){
  $scope.data = {};
  $scope.showAlert = false;

  $scope.login = function () {
    $scope.dataLoading = true;

    $http.post('/auth/login',$scope.data).success(function(data){
      $location.path('/index');
    }).error(function(err){
      $scope.showAlert = true;
      $scope.dataLoading = false;
    });
  }
}

controllers.homeController = function($scope, $location,$http){
  $scope.data = {};
  $scope.showAlert = false;
}

app.controller(controllers)

var directives = {};
directives.notification = function($timeout){
  return {
     restrict: 'E',
     replace: true,
     scope: {
         ngModel: '='
     },
     template: '<div class="alert alert-danger" bs-alert="ngModel" >Riprova</div>',
     link: function(scope, element, attrs){
     }
  }
}

app.directive(directives);
