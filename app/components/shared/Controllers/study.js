(function () {
    'use strict';

    angular
        .module('app')
        .factory('StudyService', StudyService);

    StudyService.$inject = ['$http'];
    function StudyService($http) {
        var application = "/hucare";

        var service = {};

        service.GetAll = GetAll;
        service.GetById = GetById;
        service.GetByPatient = GetByPatient;
        service.Create = Create;

        return service;

        function GetAll() {
            return $http.get(application + '/studies').then(handleSuccess, handleError('Error getting all studies'));
        }

        function GetById(id) {
            return $http.get(application + '/studies/' + id).then(handleSuccess, handleError('Error getting user by id'));
        }

        function GetByPatient(id) {
            return $http.get(application + '/studies/patient/' + id).then(handleSuccess, handleError('Error getting user by id'));
        }

        function Create(study) {
            return $http.post(application + '/studies', study).then(handleSuccess, handleError);
        }

        // private functions

        function handleSuccess(res) {
            return res.data;
        }

        function handleError(error) {
            return function () {
                return { success: false, message: error };
            };
        }
    }

})();
