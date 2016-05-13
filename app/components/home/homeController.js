(function () {
    'use strict';

    angular
        .module('app')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['UserService', 'PatientService', 'DoctorService', 'AuthenticationService', 'OptionService', 'StudyService', '$rootScope', '$location', '$timeout', '$window'];
    function HomeController(UserService, PatientService, DoctorService, AuthenticationService, OptionService, StudyService, $rootScope, $location, $timeout, window) {

        var vm = this;
        vm.Math = window.Math;

        vm.errors = {};
        vm.today = new Date();

        vm.countPatView = 0;

        vm.check = {};
        vm.check[1] = true;
        vm.check[2] = true;
        vm.check[3] = true;

        vm.showTab = 1;
        vm.showModal = false;
        vm.showPatientModal = false;

        vm.itemsPerPage = 10;

        vm.loadUser = loadUser;
        vm.logout = logout;
        vm.changeView = changeView;
        vm.cleanForm = cleanForm;
        //Submits
        vm.submitUser = submitUser;
        vm.submitPatient = submitPatient;

        vm.backToHomepage = backToHomepage;
        vm.change = change;
        vm.cleanMet = cleanMet;

        vm.isEligible = isEligible;

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

                changeView('components/home/homepage.html',3);
              }
            });
        }
        function logout() {
          AuthenticationService.Logout(function(){
            AuthenticationService.ClearCredentials();
            $location.path('/login');
          });
        }

        //Profile functionalities
        function loadUser(id) {
            UserService.GetById(id)
                .then(function (user) {
                    vm.data = user;
                });
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
              DoctorService.GetAll().then(function (response) {
                vm.doctors = response;
              });
              else{
                if(loadItems == 3) //Load patients
                  PatientService.GetAll().then(function (response) {
                    vm.patients = response['patients'];
                    vm.ClinicAbbr = response['clinic'];
                    vm.pagination = 1;
                  });
                  else{
                    if(loadItems == 4){
                        vm.countPatView = 0;
                        vm.patientPage = "components/home/editPatientPage0.html";
                    }
                    else{
                      if(loadItems == 5) //Load patient with id
                        UserService.GetByUsername(vm.user.username).then(function (response) {
                          vm.data = response;
                        });
                      else{
                        if(loadItems == 6) //Load study with id
                          StudyService.GetByPatient(id).then(function (response) {
                            vm.showSidebar = true;
                            vm.data = response;
                            vm.data['id'] = id;
                          });
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
          if(vm.form)
            vm.form.$setPristine();
        }

        function cleanMet(){
          if(vm.data.Patient.metastatic == 2){
            vm.data.Patient.metastatic1 = null;
            vm.data.Patient.metastatic2 = null;
            vm.data.Patient.metastatic3 = null;
            vm.data.Patient.metastatic4 = null;
            vm.data.Patient.metastatic5 = null;
            vm.data.Patient.metastatic6 = null;
            vm.data.Patient.metastatic7 = null;
            vm.data.Patient.metastaticother = "";
          }
        }

        function change(id){
          vm.countPatView = (id+vm.countPatView)%3;
          vm.patientPage = "components/home/editPatientPage"+ vm.countPatView + ".html";
        }

        function submitUser(changePage){
          if(!vm.data.ClinicId) vm.data.ClinicId = vm.user.ClinicId;
          if(!vm.data.GroupId) vm.data.GroupId = 2;
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
                line.addClass((vm.data.active == 1 ? "success" : "danger"));
                cleanForm();
              }
            },function(error){
              vm.error = error.success;
              vm.message = error.message;
            });
          }
        }

        function submitPatient(isEligible){
          if(!isEligible)
          {
            
            vm.data.Patient = null;
          }

          if(vm.form.$invalid && vm.data.Patient.finalized == 1){
            alert("Paziente non finalizzabile, controllare i campi bordati di rosso");
            return;
          }

          vm.data.Screening.ClinicId = vm.user.ClinicId;
          PatientService.Create(vm.data,isEligible).then(function(response){
            if(("success" in response)){
              vm.error = !response.success;
              vm.message = response.message.data;
              return;
            }

            vm.data.id = response.id;
            vm.patients.push({id : vm.data.id});
            vm.showPatientModal = true;
            //INVIA paziente via mail
            /*angular.element("#link").attr("href", angular.element("#link").attr("href") +
                        vm.data.id + "%2c" +
                        vm.data.name + "%2c" +
                        vm.data.surname + "%2c" +
                        vm.data.birth + "%2c" +
                        vm.data.code);*/
            //angular.element("#link").trigger('click');
          });
        }

        function backToHomepage(){
          vm.showPatientModal = false;
          vm.success = true;
          cleanForm();
          timer(true,true);

        }

        function timer(successAlert,mChangeView){
          vm.success = successAlert;
          vm.error = !successAlert;
          $timeout(function () {
            vm.success = false;
            vm.error = false;
            if(mChangeView)  changeView('components/home/homepage.html',3);
          }, 3000);
        }
        // TEMPLATE
        function isEligible(obj){
          if(obj === undefined)
            return false;
          return (obj.incl1 == 1 && obj.incl2 == 1 && obj.incl3 == 1 && obj.incl4 == 1 && obj.incl5 == 1)
            &&
            (obj.excl1 == 2 && obj.excl2 == 2 && obj.excl3 == 2 && obj.excl4 == 2 && obj.excl5 == 2 && obj.excl6 == 2 && obj.excl7 == 2)
            &&
            ((obj.signed == 1 && obj.consenso != ""));
        }

        String.prototype.hashCode = function(){
          var hash = 0, i, chr, len;
          if(this.length === 0) return hash;
          for(i = 0, len = this.length; i < len; i++){
            chr = this.charCode(i);
            hash = ((hash << 5) - hash) + chr;
          }
        }

    }

})();
