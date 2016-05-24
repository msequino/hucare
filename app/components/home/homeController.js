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
        vm.yrs18ago = new Date(vm.today.getFullYear()-18,vm.today.getMonth(),vm.today.getDate());
        vm.yrs75ago = new Date(vm.today.getFullYear()-75,vm.today.getMonth(),vm.today.getDate());

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
        vm.printDiv = printDiv;

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
                            angular.copy(response.data,vm.data.Patient);
                            angular.copy(response.data.Screening,vm.data.Screening);
                            delete vm.data.Patient.Screening;

                            var pdd = vm.data.Patient.birth.substr(0,10).split("-");

                            vm.qrcode = vm.data.Screening.Clinic.abbr + vm.data.Patient.name + ';' + pdd[2] + "" + pdd[1];

                            vm.finalized = vm.data.Patient.finalized;
                            vm.countPatView = 1;
                            vm.patientPage = "components/home/editPatientPage1.html";

                          });
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
          vm.qrcode = '';
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
            vm.data.Patient.metastaticother = null;
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
                cleanForm();
              }
            },function(error){
              vm.error = error.success;
              vm.message = error.message;
            });
          }
        }

        function submitPatient(savable){
          var isEligible = vm.isEligible(vm.data.Screening);
          if(!(isEligible || savable))
          {
            vm.showPatientModal = true;
            vm.data.Patient = {};
            return;
          }

          vm.data.Patient = vm.data.Patient || {};
          vm.data.Screening = vm.data.Screening || {};

          if(missingItems(vm.data.Screening)){
            alert("Compilare i criteri di eleggibilità");
            return;
          }

          if(vm.form.$invalid && vm.data.Patient.finalized){
            alert("Paziente non finalizzabile, controllare i campi bordati di rosso");
            return;
          }

          vm.data.Screening.ClinicId = vm.user.ClinicId;
          if(!vm.data.Patient.id)
            PatientService.Create(vm.data,isEligible).then(function(response){
              if(("success" in response)){
                vm.error = !response.success;
                vm.message = response.message.data;
                return;
              }
              //vm.data.Patient.id = response.id;
              //vm.patients.push({id : vm.data.id});
              vm.backToHomepage();
            });
          else
            PatientService.Update(vm.data.Patient).then(function(response){
              if(("success" in response)){
                vm.error = !response.success;
                vm.message = response.message.data;
                return;
              }
              vm.backToHomepage();
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
            &&(
            ((obj.signed == 1 && obj.consenso != "")) || ((obj.signed == 2 && obj.tablet)));
        }

        function missingItems(obj){
          return (!obj.incl1 || !obj.incl2 || !obj.incl3 || !obj.incl4 || !obj.incl5) ||
             (!obj.excl1 || !obj.excl2 || !obj.excl3 || !obj.excl4 || !obj.excl5 || !obj.excl6 || !obj.excl7) ||
             (!obj.signed);
        }

        function printDiv(data) {

          var canvas = angular.element(document.querySelector("canvas"))[0];
          var pngUrl = canvas.toDataURL();
          var body = buildBody(data.Patient,data.Screening,pngUrl);
          var popupWin = window.open('', '_blank', 'width=300,height=300');
          popupWin.document.open();
          popupWin.document.write('<html><head><style>* {margin:0;padding:0;} html, body {height: 100%;}#wrap {min-height: 100%;}#main {  overflow:auto;  padding-bottom: 180px; }#footer {  position: relative;  margin-top: -180px; /* negative value of footer height */  height: 180px;  clear:both;} </style></head><body onload="window.print()">' + body + '</body></html>');
          popupWin.document.close();
        }

        function buildBody(patient,screening,canvas){
          var body = "<header>"+
            "<table border='1' style='width:100%'><tbody>"+
            "<tr><td>Codice Paziente</td><td>Centro</td><td>Data inclusione</td></tr>"+
            "<tr><td>" + screening.Clinic.abbr+patient.name + "</td><td>" + screening.Clinic.name + "</td><td>"+ new Date(screening.consenso).getDate()+"/" + ("0" + (new Date(screening.consenso).getMonth()+1)).substr(("0" + (new Date(screening.consenso).getMonth()+1)).length-2)+ "/" + new Date(screening.consenso).getFullYear()+ "</td></tr>"+
            "</tbody></table>"+
            "</header>"+

            "<br><br>"+
            "<div id='wrap'>"+
            "<div id='main'>"+
            "<table><tbody>"+
            "<tr><td>Codice Paziente</td><td>" + screening.Clinic.abbr+patient.name + "</td></tr>"+
            "<tr><td>Data di nascita</td><td>" + patient.birth.substr(0,10) + "</td></tr>"+
            "<tr><td>Sesso</td><td>" + (patient.sex == 1 ? "Uomo" : "Donna") + "</td></tr>"+
            "<tr><td>Stato civile</td><td>" + (patient.marital == 1 ? "Coniugato/a o convive stabilmente" : "Altro") + "</td></tr>"+
            "<tr><td>Istruzione</td><td>" + (patient.scholar == 1 ? "Primario (nessuna/elementare/media)" : (patient.scholar == 2 ? "Secondario (diploma scuola superiore)" : "Universitario (laurea/post-laurea)")) + "</td></tr>"+
            "</tbody></table>"+

            "<br><br><img height='100' width='100' src='" + canvas + "'/>"+
            "</div>"+
            "</div>"+

            "<div id='footer'>"+
              "<table border='1' style='width:100%'><tbody>"+
              "<tr><td>Città</td><td>Firma medico</td><td>Data</td></tr>"+
              "<tr><td>" + screening.Clinic.city + "</td><td>_________________</td><td>"+ new Date().getDate()+"/" + ("0" + (new Date().getMonth()+1)).substr(("0" + (new Date().getMonth()+1)).length-2)+ "/" + new Date().getFullYear()+ "</td></tr>"+
              "</tbody></table>"+
            "</div>";

          return body;
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

})();
