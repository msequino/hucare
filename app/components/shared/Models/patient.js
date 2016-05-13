(function () {
    'use strict';

    angular
        .module('app')
        .factory('PatientService', PatientModel);

    PatientService.$inject = ['$http'];
    function PatientService($http) {
        var service = {};

        var application = "/hucare";
        service.GetAll = GetAll;

        return service;

        function GetAll() {
          
        }

        // private functions
        function handleSuccess(res) {
            return res.data;
        }

        function handleError(error) {
            return { success: false, message: error };
        }
    }

})();
