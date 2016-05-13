(function () {
    'use strict';

    angular
        .module('app')
        .factory('PatientService', PatientService);

    PatientService.$inject = ['$http'];
    function PatientService($http) {
        var service = {};

        var application = "/hucare";
        service.GetAll = GetAll;
        service.GetById = GetById;
        service.Create = Create;
        service.Update = Update;
        service.Delete = Delete;

        return service;

        function GetAll() {
            return $http.get(application + '/patients').then(handleSuccess, handleError('Error getting all patients'));
        }

        function GetById(id) {
            return $http.get(application + '/patients/' + id).then(handleSuccess, handleError('Error getting user by id'));
        }

        function Create(patient,isEligible) {
            return $http.post(application + '/patients' + (isEligible ? '' : '/screening'), patient).then(handleSuccess, handleError);
        }

        function Update(patient) {
            return $http.put(application + '/patients/' + patient.id, patient).then(handleSuccess, handleError);
        }

        function Delete(id) {
            return $http.delete(application + '/patients/' + id).then(handleSuccess, handleError('Error deleting user'));
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
