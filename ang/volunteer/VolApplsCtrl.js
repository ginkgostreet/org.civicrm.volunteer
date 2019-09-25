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

  angular.module('volunteer').controller('VolApplsCtrl', function ($route, $scope,crmApi,$window, custom_fieldset_volunteer, $location) {
    if (!$window.location.origin) {
      $window.location.origin = $window.location.protocol + "//" 
        + $window.location.hostname 
        + ($window.location.port ? ':' + $window.location.port : '');
    }
    var ts = $scope.ts = CRM.ts('org.civicrm.volunteer');
    $scope.search="";
    $scope.currentTemplate = "~/volunteer/AppealGrid.html"; //default view is grid view
    $scope.totalRec;
    $scope.currentPage = 1;
    $scope.pageSize = 10;
    $scope.appealCustomFieldData = {};
    $scope.options=[{key:"dateE",val:"Upcoming"},{key:"dateS",val:ts('Newest Opportunities')},{key:"titleA",val:"Title A-Z"},{key:"titleD",val:"Title Z-A"},{key:"benfcrA",val:"Project Beneficiary A-Z"},{key:"benfcrD",val:"Project Beneficiary Z-A"}];
    $scope.sortValue = $scope.options[0];
    $scope.sortby=$scope.order=null;
    $scope.basepath=$window.location.origin+Drupal.settings.basePath+"sites/default/files/civicrm/persist/contribute/appeal/thumb/";
    $scope.activeGrid = "grid_view";
    $scope.beneficiary_name = "";

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
    getAppeals = function (advancedFilter,filterObj, firstTime) {
      CRM.$('#crm-main-content-wrapper').block();
      // this line will check if the argument is undefined, null, or false
      // if so set it to false, otherwise set it to it's original value
      var firstTime = firstTime || false;
      let params={};
      if($window.localStorage.getItem("search_params") && firstTime == true) {
        params = JSON.parse($window.localStorage.getItem("search_params"));
        params.page_no ? $scope.currentPage=params.page_no : null;
        params.search_appeal ? $scope.search=params.search_appeal : null;
        params.orderby ? $scope.sortby=params.orderby : null;
        params.order ? $scope.order=params.order : null;
        params.sortOption ? $scope.sortValue=$scope.options[params.sortOption] : 0;
        params.advanced_search_option ? $scope.advanced_search=params.advanced_search_option : false;
        if(params.advanced_search_option) {
          params.advanced_search.fromdate ? $scope.date_start=params.advanced_search.fromdate : null;
          params.advanced_search.todate ? $scope.date_end=params.advanced_search.todate : null;

          if(params.advanced_search.show_appeals_done_anywhere) {
            params.advanced_search.show_appeals_done_anywhere ? $scope.show_appeals_done_anywhere=params.advanced_search.show_appeals_done_anywhere : null;
          } else {
            if(params.advanced_search.proximity) {
              params.advanced_search.proximity.radius ? $scope.radius=params.advanced_search.proximity.radius : null;
              params.advanced_search.proximity.unit ? $scope.unit=params.advanced_search.proximity.unit : null;
            }
            params.location_finder_way ? $scope.location_finder_way=params.location_finder_way : null;
            if(params.location_finder_way == "use_postal_code") {
              params.advanced_search.proximity.postal_code ? $scope.postal_code=params.advanced_search.proximity.postal_code : null;
            }
            if(params.location_finder_way == "use_my_location") {
              params.advanced_search.proximity.lat ? $scope.lat=params.advanced_search.proximity.lat : null;
              params.advanced_search.proximity.lon ? $scope.lon=params.advanced_search.proximity.lon : null;
            }
          }
          params.advanced_search.appealCustomFieldData ? $scope.appealCustomFieldData=params.advanced_search.appealCustomFieldData : null;
        }
      }
      $scope.currentPage?params.page_no=$scope.currentPage:null;
      $scope.search?params.search_appeal=$scope.search:null;
      $scope.sortby?params.orderby=$scope.sortby:null;
      $scope.order?params.order=$scope.order:null;
      if($scope.advanced_search) {
        // Default Proximity Object Set to empty.
        params.advanced_search={proximity:{}};
        $scope.date_start?params.advanced_search.fromdate=$scope.date_start:null;
        $scope.date_end?params.advanced_search.todate=$scope.date_end:null;
        // If Show appeals done anywhere checkbox is disable then and then proximity set. 
        if(!$scope.show_appeals_done_anywhere) {
          $scope.radius?params.advanced_search.proximity.radius=$scope.radius:null;
          $scope.unit?params.advanced_search.proximity.unit=$scope.unit:null;
          if($scope.location_finder_way == "use_postal_code") {
            $scope.postal_code?params.advanced_search.proximity.postal_code=$scope.postal_code:null;
          } else {
            $scope.lat?params.advanced_search.proximity.lat=$scope.lat:null;
            $scope.lon?params.advanced_search.proximity.lon=$scope.lon:null;
          }
        }
        $scope.show_appeals_done_anywhere?params.advanced_search.show_appeals_done_anywhere=$scope.show_appeals_done_anywhere:null;
        // Pass custom field data from advance search to API.
        params.advanced_search.appealCustomFieldData = $scope.appealCustomFieldData;
      }
      var current_parms = $route.current.params;
      if (current_parms.beneficiary && typeof current_parms.beneficiary === "string") {
        params.beneficiary = current_parms.beneficiary;
      }
      if(params.beneficiary) {
        var beneficiaryArray = params.beneficiary.split(",");
        for(var i = 0; i < beneficiaryArray.length; i++) {
          if (i != (beneficiaryArray.length - 1)) {
            CRM.api3('Contact', 'get', {
              "sequential": 1,
              "id": beneficiaryArray[i]
            }).then(function(result) {
              if(result && result.values.length > 0) {
                $scope.beneficiary_name += result.values[0].display_name + ", ";
              }
            }, function(error) {
              // oops
              console.log(error);
            });
          } else {
            CRM.api3('Contact', 'get', {
              "sequential": 1,
              "id": beneficiaryArray[i]
            }).then(function(result) {
              if(result && result.values.length > 0) {
                $scope.beneficiary_name += result.values[0].display_name;
              }
            }, function(error) {
              // oops
              console.log(error);
            });
          }
        }
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

          var sortOption = $scope.options.findIndex(function(option) {
            return option.key == $scope.sortValue.key;
          });
          params.sortOptionKey = $scope.sortValue.key;
          params.sortOption = sortOption;
          params.location_finder_way = $scope.location_finder_way;
          params.advanced_search_option = $scope.advanced_search;
          $window.localStorage.setItem("search_params", JSON.stringify(params));
          $scope.active_search = params;
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
    getAppeals('','',true);

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

    $scope.volSignup= function(need_flexi_id,projectId,hide_appeal_volunteer_button) {
      if(hide_appeal_volunteer_button == "1") {
        $window.location.href = $window.location.origin+Drupal.settings.basePath+"civicrm/vol/#/volunteer/opportunities?project="+projectId+"&hideSearch=1";
      } else {
        $window.location.href = $window.location.origin+Drupal.settings.basePath+"civicrm/volunteer/signup?reset=1&needs[]="+need_flexi_id+"&dest=list";
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
      $scope.advanced_search = true;
      $scope.currentPage = 1;
      getAppeals();
    }

    $scope.resetFilter=function() {
      $window.localStorage.removeItem("search_params");
      $location.search('beneficiary', null);
      $route.reload();
    }

    // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
    if (!Array.prototype.findIndex) {
      Object.defineProperty(Array.prototype, 'findIndex', {
        value: function(predicate) {
         // 1. Let O be ? ToObject(this value).
          if (this == null) {
            throw new TypeError('"this" is null or not defined');
          }

          var o = Object(this);

          // 2. Let len be ? ToLength(? Get(O, "length")).
          var len = o.length >>> 0;

          // 3. If IsCallable(predicate) is false, throw a TypeError exception.
          if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
          }

          // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
          var thisArg = arguments[1];

          // 5. Let k be 0.
          var k = 0;

          // 6. Repeat, while k < len
          while (k < len) {
            // a. Let Pk be ! ToString(k).
            // b. Let kValue be ? Get(O, Pk).
            // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
            // d. If testResult is true, return k.
            var kValue = o[k];
            if (predicate.call(thisArg, kValue, k, o)) {
              return k;
            }
            // e. Increase k by 1.
            k++;
          }

          // 7. Return -1.
          return -1;
        }
      });
    }

  });

})(angular, CRM.$, CRM._);