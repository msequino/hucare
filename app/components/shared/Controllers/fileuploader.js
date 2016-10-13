(function () {
    'use strict';

    angular
        .module('app')
        .service('FileUploaderService', FileUploaderService);

        FileUploaderService.$inject = ['$http'];
        function FileUploaderService($http) {
          var service = {};

          var application = "/hucare";

          service.uploadFileToUrl = uploadFileToUrl;

          return service;

          function uploadFileToUrl(file,type,clinic){
             var fd = new FormData();
             fd.append('file', file);
             var args = "type="+type;
             args += (clinic ? "&clinic="+clinic : "");

             $http.post(application + "/uploadFile?"+args, fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
             })

             .success(function(){
               alert("File caricato");
             })

             .error(function(){
               alert("Errore");
             });
          }
          return this;
        }
        })();
