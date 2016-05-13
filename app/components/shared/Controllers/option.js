(function () {
    'use strict';

    angular
        .module('app')
        .factory('OptionService', OptionService);

    OptionService.$inject = ['$http'];
    function OptionService($http) {
        var service = {};

        var application = "/hucare";
        service.Get = Get;

        return service;

        function Get(item) {
            return $http.get(application + '/'+item).then(handleSuccess, handleError('Error getting all '+ item));
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
