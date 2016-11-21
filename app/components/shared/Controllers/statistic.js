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
        service.GetDataset = GetDataset;
        service.GetDatasetUrl = GetDatasetUrl;

        return service;

        function GetAll(period) {
            return $http.get('/hucare/stats' + period).then(handleSuccess, handleError('Error getting all doctors'));
        }

        function GetQuestionaire(id) {
            return $http.get('/hucare/stats/quest' + id).then(handleSuccess, handleError('Error getting doctor by id'));
        }

        function GetDataset() {
            return $http.post('/hucare/stats/dataset')
                        .then(handleSuccess, handleError('Error getting doctor by id'));
        }

        function GetDatasetUrl() {
            return '/hucare/stats/dataset';
        }


        // private functions
        function handleSuccess(res) {
          console.log(res.data);
            return res.data;
        }

        function handleError(error) {
            return { success: false, message: error };
        }
    }

})();
