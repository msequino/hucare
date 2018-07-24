(function () {
    'use strict';

    angular
        .module('app')
        .controller('HomeController', HomeController)
        .controller('ModalController', ModalController)
        .controller('ModalControllerAreUSure', ModalControllerAreUSure)

      HomeController.$inject = ['FileUploaderService','UserService', 'PatientService', 'StatisticService', 'AuthenticationService', 'OptionService', 'StudyService', '$rootScope', '$location', '$timeout','$modal', '$window'];
      function HomeController(FileUploaderService, UserService, PatientService, StatisticService, AuthenticationService, OptionService, StudyService, $rootScope, $location, $timeout, $modal, window) {

        var vm = this;
        vm.Math = window.Math;

        vm.errors = {};
        vm.Comparing = {};
        vm.today = new Date();
        vm.yrs18ago = new Date(vm.today.getFullYear()-18,vm.today.getMonth(),vm.today.getDate());
        vm.yrs75ago = new Date(vm.today.getFullYear()-75,vm.today.getMonth(),vm.today.getDate());

        vm.countPatView = 0;

        vm.check = {};
        vm.check[1] = true;
        vm.check[2] = true;
        vm.check[3] = true;

        vm.documents = [{id:0,name:''},{id:1,name:'Utilizzo app (video in formato mp4)'},{id:2,name:'Esempio clinico (video in formato mp4)'},
        {id:3,name:'FAQ'},{id:4,name:'Protocollo'},{id:5,name:'Sinossi'},{id:6,name:'Eortc'},{id:7,name:'Hads'},
        {id:8,name:'Neq'},{id:9,name:'Fogli informativi *'},{id:10,name:'Consenso informato *'}];

        vm.timeInterval = [{id:0,name:'Tutto - dal 2016-10-17 al 2018-07-27'},{id:1,name:'Periodo 1 - dal 2016-10-17 al 2017-01-27'},{id:2,name:'Periodo 2 - dal 2017-02-06 al 2017-05-19'},
        {id:3,name:'Periodo 3 - dal 2017-06-12 al 2017-09-22'},{id:4,name:'Periodo 4 - dal 2017-12-04 al 2018-03-16'},{id:5,name:'Periodo 5 - dal 2018-04-16 al 2018-07-27'}];

        vm.myFile = "";

        vm.showTab = 1;
        vm.showModal = false;
        vm.showPatientModal = false;

        vm.itemsPerPage = 10;

        vm.Eortc = {}
        vm.Hads = {}
        vm.Neq = {}
        vm.loadUser = loadUser;
        vm.logout = logout;
        vm.changeView = changeView;
        vm.cleanForm = cleanForm;
        vm.changeResource = changeResource;
        //Submits
        vm.submitUser = submitUser;
        vm.savePatient = savePatient;
        vm.cleanMetastics = cleanMetastics;
        vm.uploadFile = uploadFile;

        vm.downloadDataset = downloadDataset;
        vm.backToHomepage = backToHomepage;
        vm.change = change;

        vm.isActive = 1;
        vm.pdf = false;
        vm.resource_name = '';

        initController();

        function initController() {
            AuthenticationService.GetSession(function(response){
              if(!response){
                AuthenticationService.ClearCredentials();
                $location.path("/login");
              }
              else{
                vm.user = response;
                OptionService.Get('clinics').then(function(response){
                  vm.clinics = response;
                });
                if(vm.user.ClinicId)
                  changeView('components/home/documentation.html',6);
                else
                  changeView('components/home/statsPatients.html',2);
              }
            });
        }
        function logout() {
          AuthenticationService.Logout(function(){
            AuthenticationService.ClearCredentials();
            $location.path('/login');
          });
        }

        function downloadDataset(test) {
          window.open(StatisticService.GetDatasetUrl() + test, '_blank');
        }

        //Profile functionalities
        function loadUser(id) {
            UserService.GetById(id)
                .then(function (user) {
                    vm.data = user;
                    if(user.test_date)
                      vm.data.test_date = user.test_date.substr(0,user.test_date.indexOf("T"));
                });
        }


        //Upload File
        function uploadFile() {
            FileUploaderService.uploadFileToUrl(vm.data.myFile,vm.data.documentName,vm.data.ClinicId);

        }

        //Clean metastatics
        function cleanMetastics() {
          vm.data.Patient.metastatic1 = null;
          vm.data.Patient.metastatic2 = null;
          vm.data.Patient.metastatic3 = null;
          vm.data.Patient.metastatic4 = null;
          vm.data.Patient.metastatic5 = null;
          vm.data.Patient.metastatic6 = null;
          vm.data.Patient.metastatic7 = null;
          vm.data.Patient.metastaticother = null;
        }

        //USER functionality

        // TEMPLATE
        function changeView(next,loadItems,id){
          if(loadItems == 1) //Load Users
            UserService.GetAll().then(function (response) {
              vm.users = response;
            });
          else{
            if(loadItems == 2) //Load doctors
              StatisticService.GetAll("/"+(vm.periodStat ? vm.periodStat : "0")).then(function (response) {
                // vm.patientPage = "components/home/editPatientPage1.html";
                vm.clinicCounter = response.data;
                //vm.clinicCounter = [{username :"TO"},{username :"BR"},{username :"NU"},{username :"TG"},{username :"VR"},{username :"PA"},{username :"MI"},{username :"BR"},{username :"NU"}];
              });
              else{
                if(loadItems == 3) //Load patients
                  PatientService.GetAll().then(function (response) {
                    vm.patients = response.data;
                    vm.pagination = 1;
                  });
                  else{
                    if(loadItems == 4){
                        vm.countPatView = 0;
                        vm.patientPage = "components/home/editPatientPage0.html";
                        vm.finalized = 0;
                        if(id)
                          PatientService.GetById(id).then(function (response) {

                            vm.data.Patient = {};
                            vm.data.Screening = {};
                            vm.data.T0Reporting = {};
                            vm.data.T1Reporting = {};
                            angular.copy(response.data,vm.data.Patient);
                            angular.copy(response.data.Screening,vm.data.Screening);
                            angular.copy(response.data.T0Reporting,vm.data.T0Reporting);
                            angular.copy(response.data.T1Reporting,vm.data.T1Reporting);
                            delete vm.data.Patient.Screening;

                            vm.data.disabled = true;
                            
                            var pdd = vm.data.Patient.birth.substr(0,10).split("-");

                            vm.data.Patient.birth = vm.data.Patient.birth.substring(0,vm.data.Patient.birth.indexOf("T"));
                            vm.data.Patient.date = vm.data.Patient.date.substring(0,vm.data.Patient.date.indexOf("T"));

                            //vm.qrcode = vm.data.Screening.Clinic.abbr + vm.data.Patient.name + ';' + pdd[2] + "" + pdd[1];

                            vm.finalized = vm.data.Patient.finalized;
                            vm.countPatView = 1;
                            vm.patientPage = "components/home/editPatientPage1.html";

                          });
                    }
                    else{
                      if(loadItems == 5) //Load patient with id
                        StatisticService.GetQuestionaire("/"+(vm.ChosenClinic ? vm.ChosenClinic : "0")+ "/"+(vm.periodQuest ? vm.periodQuest : "0")).then(function (response) {
                          vm.questCounter = response.data;

                        });
                      else{
                        if(loadItems == 6){
                          vm.isActive = 1;
                          vm.pdf = false;
                          vm.resource_name = 'resources/commons/registrazione1.mp4';
                        } else if(loadItems == 7){

                        } else if(loadItems == 8) {
                          vm.pageQuest = 1;

                        }
                      }
                    }
                  }
              }
          }
          cleanForm();
          vm.template = next;
        }

        function cleanForm(){
          vm.data = {};
          vm.qrcode = '';

          vm.error = false;
          vm.success = false;
          vm.message = "";
          if(vm.form)
            vm.form.$setPristine();
        }

        function changeResource(view,resource,buttonId){
          vm.pdf = view;
          vm.resource_name = resource;
          vm.isActive = buttonId;
        }

        function change(id){
          vm.countPatView = (id+vm.countPatView)%6;
          vm.patientPage = "components/home/editPatientPage"+ vm.countPatView + ".html";
        }

        function submitUser(changePage){
          if(!vm.data.ClinicId) vm.data.ClinicId = vm.user.ClinicId;
          if(!vm.data.GroupId) vm.data.GroupId = 2;
          if(vm.data.test_date) vm.data.test_date = vm.data.test_date.split("-")[0] +"-"+ vm.data.test_date.split("-")[1] +"-"+ vm.data.test_date.split("-")[2];

          //vm.data.password =
          if(!vm.data.id)
            UserService.Create(vm.data).then(function(response){
              if(typeof response.success != 'undefined'){
                if(("success" in response)){
                  vm.error = !response.success;
                  vm.message = response.message.data;
                  return;
                }
              }
              vm.data.id = response.id;
              vm.data.password = null;
              vm.users.push(vm.data);
              cleanForm();
            });
          else{
            if(!vm.data.password || vm.data.password.length == 0) delete vm.data.password;
            UserService.Update(vm.data).then(function(response){
              if(("success" in response)){
                vm.error = !response.success;
                vm.message = response.message.data;
                return;
              }
              if(changePage){
                vm.success = true;

              }else {
                var line = angular.element(document.querySelector("#user"+vm.data.id));
                line.children().text(vm.data.name + " " + vm.data.surname);
                line.removeClass("success");
                line.removeClass("danger");
                cleanForm();
              }
            },function(error){
              vm.error = error.success;
              vm.message = error.message;
            });
          }
        }

        vm.compare = function() {
          alert(vm.Comparing.Patient1 + " " + vm.Comparing.Patient2 + " " + vm.Comparing.Type + " ")
            PatientService.GetById(vm.Comparing.Patient1).then(function (res1) {
                PatientService.GetById(vm.Comparing.Patient2).then(function (res2) {

                  console.log(res1, res2)
                });
            })
        }

        vm.saveQuestionaires = function () {

            //console.log(vm.user.username)
            //console.log(vm.Comparing, vm.Eortc, vm.Hads, vm.Neq );

            vm.Eortc = Object.assign({time: vm.Comparing.Type, patientid: vm.Comparing.Patient1, userid: vm.user.username}, vm.Eortc);
            vm.Hads = Object.assign({time: vm.Comparing.Type, patientid: vm.Comparing.Patient1, userid: vm.user.username}, vm.Hads);
            vm.Neq = Object.assign({time: vm.Comparing.Type, patientid: vm.Comparing.Patient1, userid: vm.user.username}, vm.Neq);
            var data = {
                Eortc : vm.Eortc,
                Hads : vm.Hads,
                Neq : vm.Neq
            };


            var modalInstance = $modal.open({
                templateUrl: 'myModalContentAreUSure.html',
                controller: 'ModalControllerAreUSure',
                size: "lg",
                resolve: {
                    data: function () {
                        return data;
                    }
                }
            });

            modalInstance.result.then(function (response) {
                if(response.code == 200){
                    vm.error = false;
                    vm.success = true;
                    vm.message = response.message;

                    vm.Eortc = {};
                    vm.Hads = {};
                    vm.Neq = {};
                } else {
                    vm.error = true;
                    vm.success = false;
                    vm.message = response.message;
                }
            }, function(error){
                vm.error = true;
                vm.success = false;
                vm.message = error.message;

            });

        }

        function savePatient(){
          var oldBirth = vm.data.Patient.birth;
          var oldDate = vm.data.Patient.date;
          vm.data.Patient.birth = new Date(vm.data.Patient.birth);
          vm.data.Patient.date = new Date(vm.data.Patient.date);
          delete vm.data.Screening;
          PatientService.Update(vm.data).then(function(response){
            if(("success" in response)){
              vm.error = !response.success;
              vm.message = response.message.data;
              return;
            }

            vm.data.Patient.birth = oldBirth;
            vm.data.Patient.date = oldDate;
            vm.success = true;
          },function(error){
            vm.error = error.success;
            vm.message = error.message;
          });
        }

        function backToHomepage(){
          vm.showPatientModal = false;
          vm.success = true;
          cleanForm();
          timer(true,true);
        }

        vm.open = function (size) {
          var modalInstance = $modal.open({
            templateUrl: 'myModalContent.html',
            controller: 'ModalController',
            size: size,
            resolve: {
              name: function () {
                return vm.data.Patient.name;
              }
            }
          });

          modalInstance.result.then(function (response) {
            if(response.code == 200){
              vm.error = false;
              vm.success = true;
              vm.message = response.message;
            }
          }, function(error){
            vm.error = true;
            vm.success = false;
            vm.message = error.message;

          });
        };


        function timer(successAlert,mChangeView){
          vm.success = successAlert;
          vm.error = !successAlert;
          $timeout(function () {
            vm.success = false;
            vm.error = false;
            if(mChangeView)  changeView('components/home/homepage.html',3);
          }, 3000);
        }

        String.prototype.hashCode = function(){
          var hash = 0, i, chr, len;
          if(this.length === 0) return hash;
          for(i = 0, len = this.length; i < len; i++){
            chr = this.charCode(i);
            hash = ((hash << 5) - hash) + chr;
          }
        }

        Object.size = function(obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };

    }

    function ModalController($scope, $modalInstance, name, PatientService) {

        $scope.name = name;
        $scope.ok = function () {
            PatientService.Clone($scope.name).then(function(response){

                $modalInstance.close(response);
            })
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }


    function ModalControllerAreUSure($scope, $modalInstance, data, PatientService) {

        $scope.PatientId = data.Eortc.patientid;

        $scope.ok = function () {
            PatientService.InsertForTesting(data).then(function(response){
                $modalInstance.close(response);
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }
})();
