(function (angular, $, _) {

  angular.module('volunteer').config(function ($routeProvider) {
    $routeProvider.when('/volunteer/appeals', {
      controller: 'VolApplsCtrl',
      // update the search params in the URL without reloading the route     
      templateUrl: '~/volunteer/VolApplsCtrl.html',
      resolve: {
        custom_fieldset_volunteer: function(crmApi) {
          return crmApi('VolunteerAppeal', 'getCustomFieldsetWithMetaVolunteerAppeal', {
            controller: 'VolunteerAppeal'
          });
        }
      }
    });
  });

  angular.module('volunteer').controller('VolApplsCtrl', function ($route, $scope,crmApi,$window, custom_fieldset_volunteer) {
    var ts = $scope.ts = CRM.ts('org.civicrm.volunteer');
    $scope.search="";
    $scope.currentTemplate = "~/volunteer/AppealGrid.html"; //default view is grid view
    $scope.totalRec;
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.appealCustomFieldData = {};
    $scope.options=[{key:"dateE",val:"Upcoming"},{key:"dateS",val:"Newest Appeals"},{key:"titleA",val:"Title A-Z"},{key:"titleD",val:"Title Z-A"},{key:"benfcrA",val:"Project Beneficiary A-Z"},{key:"benfcrD",val:"Project Beneficiary Z-A"}];
    $scope.sortValue = $scope.options[0];
    $scope.sortby=$scope.order=null;
    $scope.basepath=$window.location.origin+Drupal.settings.basePath+"sites/default/files/civicrm/persist/contribute/appeal/thumb/";
    $scope.activeGrid = "grid_view";

    //Change reult view
    $scope.changeview = function(tpl, type){
      $scope.activeGrid = type;
      $scope.currentTemplate = tpl;
    }
    // Clear checkbox selection in Date and Location Filter.
    $scope.clear = function clear() {
      $scope.location_finder_way = null;
      $scope.lat = null;
      $scope.lon = null;
      $scope.postal_code = null;
    };
    // Assign custom field set values.
    $scope.custom_fieldset_volunteer = custom_fieldset_volunteer.values;

    //Get appeal data with search text and/or pagination
    getAppeals = function (advancedFilter,filterObj) {
      CRM.$('#crm-main-content-wrapper').block();
      let params={};
      $scope.currentPage?params.page_no=$scope.currentPage:null;
      $scope.search?params.search_appeal=$scope.search:null;
      $scope.sortby?params.orderby=$scope.sortby:null;
      $scope.order?params.order=$scope.order:null;
      if($scope.advance_search) {
        // Default Proximity Object Set to empty.
        params.advance_search={proximity:{}};
        $scope.date_start?params.advance_search.fromdate=$scope.date_start:null;
        $scope.date_end?params.advance_search.todate=$scope.date_end:null;
        // If Show appeals done anywhere checkbox is disable then and then proximity set. 
        if(!$scope.show_appeals_done_anywhere) {
          $scope.radius?params.advance_search.proximity.radius=$scope.radius:null;
          $scope.unit?params.advance_search.proximity.unit=$scope.unit:null;
          if($scope.location_finder_way == "use_postal_code") {
            $scope.postal_code?params.advance_search.proximity.postal_code=$scope.postal_code:null;
          } else {
            $scope.lat?params.advance_search.proximity.lat=$scope.lat:null;
            $scope.lon?params.advance_search.proximity.lon=$scope.lon:null;
          }
        }
        $scope.show_appeals_done_anywhere?params.advance_search.show_appeals_done_anywhere=$scope.show_appeals_done_anywhere:null;
        // Pass custom field data from advance search to API.
        params.advance_search.appealCustomFieldData = $scope.appealCustomFieldData;
      }
      return crmApi('VolunteerAppeal', 'getsearchresult', params)
        .then(function (data) {
          let projectAppeals=[];
          for(let key in data.values.appeal) {
            projectAppeals.push(data.values.appeal[key]);
          }
          $scope.appeals=projectAppeals;
          $scope.totalRec=data.values.total_appeal;
          $scope.numberOfPages= Math.ceil($scope.totalRec/$scope.pageSize);
          $scope.closeModal();
          CRM.$('#crm-main-content-wrapper').unblock();
        },function(error) {
          CRM.$('#crm-main-content-wrapper').unblock();
          if (error.is_error) {
            CRM.alert(error.error_message, ts("Error"), "error");
          } else {
            return error;
          }
        }); 
    }  
    //Loading  list on first time
    getAppeals();

    //update current page to previouse and get result data
    $scope.prevPageData=function(){
      $scope.currentPage=$scope.currentPage-1;
      getAppeals();
    }

    //update current page to next and get result data
    $scope.nextPageData=function(){
      $scope.currentPage=$scope.currentPage+1;
      getAppeals();
    }

    //reset page count and search data
    $scope.searchRes=function(){
      $scope.currentPage = 1;
      getAppeals();
    }

    //sort title,dates,beneficiaries by asc and desc
    $scope.sort=function(){
      $scope.currentPage = 1;
      checkAndSetSortValue();
      getAppeals();
    }

    //Set sort by and order by according to value selected
    function checkAndSetSortValue() {
      console.log($scope.sortValue.key);
      let sortby,orderby=null;
      if($scope.sortValue.key=="titleA"){
        sortby="title";
        orderby="ASC";
      } else if ($scope.sortValue.key=="titleD"){
        sortby="title";
        orderby="DESC";
      } else if($scope.sortValue.key=="dateS"){
        sortby="active_fromdate";
        orderby="DESC";
      } else if($scope.sortValue.key=="dateE"){
        sortby="upcoming_appeal";
        orderby="DESC";
      } else if($scope.sortValue.key=="benfcrA"){
        sortby="project_beneficiary";
        orderby="ASC";
      } else if($scope.sortValue.key=="benfcrD"){
        sortby="project_beneficiary";
        orderby="DESC";
      }
      $scope.sortby=sortby;
      $scope.order=orderby;
    }

    $scope.redirectTo=function(appealId) {
      $window.location.href = $window.location.origin+Drupal.settings.basePath+"civicrm/vol/#/volunteer/appeal/"+appealId;
    }

    $scope.volSignup= function(needId,projectId) {
      if(needId) {
        $window.location.href = $window.location.origin+Drupal.settings.basePath+"civicrm/volunteer/signup?reset=1&needs[]="+needId+"&dest=list";
      } else {
        $window.location.href = $window.location.origin+Drupal.settings.basePath+"civicrm/vol/#/volunteer/opportunities?project="+projectId+"&hideSearch=1";
      }
    }

    $scope.openModal=function(){
      $scope.modalClass="modalDialog"
    }

    $scope.closeModal=function() {
      $scope.modalClass=null;
    }

    $scope.active = 1;
    $scope.selectTab = function(value){
      $scope.active = value;
    }

    $scope.isActive = function(value){
      if($scope.active==value){
        return true;
      }
      else {
        return false;
      }
    }

    $scope.getPosition = function (){
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(showPosition);
      } else {
        alert("Sorry, your browser does not support HTML5 geolocation.");
      }
    }
  
    function showPosition(position) {
      $scope.$apply(function() {
        $scope.lat = position.coords.latitude;
        $scope.lon= position.coords.longitude;
      });  
    };

    $scope.proximityUnits = [
      {value: 'km', label: ts('km')},
      {value: 'miles', label: ts('miles')}
    ];

    $scope.radiusvalue = [
      {value: 2, label: ts('2')},
      {value: 5, label: ts('5')},
      {value: 10, label: ts('10')},
      {value: 25, label: ts('25')},
      {value: 100, label: ts('100')}
    ];

    $scope.advanceFilter=function() {
      let params={proximity:{}};
      $scope.advance_search = true;
      $scope.currentPage = 1;
      getAppeals();
    }
  });

})(angular, CRM.$, CRM._);