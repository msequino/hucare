(function () {
    'use strict';

    angular
        .module('app')
        .factory('StatisticService', StatisticService);

    StatisticService.$inject = ['$http'];
    function StatisticService($http) {
        var service = {};

        service.GetAll = GetAll;
        service.GetQuestionaire = GetQuestionaire;

        return service;

        function GetAll() {
            return $http.get('/hucare/stats').then(handleSuccess, handleError('Error getting all doctors'));
        }

        function GetQuestionaire(id) {
            return $http.get('/hucare/stats/quest' + id).then(handleSuccess, handleError('Error getting doctor by id'));
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
