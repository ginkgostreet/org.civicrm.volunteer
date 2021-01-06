(function(angular, $, _) {

  angular.module('volunteer').config(function($routeProvider) {
    $routeProvider.when('/volunteer/appeal/:appealId', {
      controller: 'VolunteerAppealDetail',
      templateUrl: '~/volunteer/AppealDetail.html',
        resolve: {
          projectAppealsData: function(crmApi, $route) {
            return crmApi('VolunteerAppeal', 'getAppealData', {
              id: $route.current.params.appealId
            }).then(function (data) {              
              appeal = data.values;
              return appeal;              
            },function(error) {
                if (error.is_error) {
                  CRM.alert(error.error_message, ts("Error"), "error");
                } else {
                  return error;
                }
            });
          },
          supporting_data: function(crmApi, $route) {
            return crmApi('VolunteerUtil', 'getsupportingdata', {
              controller: 'VolunteerAppealDetail',
              appeal_id: $route.current.params.appealId
            });
          },
        }
    });
  });

  angular.module('volunteer').controller('VolunteerAppealDetail', function ($scope, crmApi, projectAppealsData, supporting_data, $window, $location) {
    if (!$window.location.origin) {
      $window.location.origin = $window.location.protocol + "//" 
        + $window.location.hostname 
        + ($window.location.port ? ':' + $window.location.port : '');
    }
    var ts = $scope.ts = CRM.ts('org.civicrm.volunteer');
    $scope.appeal = appeal;
    $scope.showShift = parseInt(appeal.display_volunteer_shift);
    $scope.locAny = parseInt(appeal.location_done_anywhere); 
    $scope.showVolunteer = parseInt(appeal.hide_appeal_volunteer_button); 
    $scope.supporting_data = supporting_data.values;
    $scope.redirectTo=function(projectId) {  
      $location.path("/volunteer/opportunities?project="+projectId+"&hideSearch=1");
    }
    // Redirect Back to Search Appeal Page.
    $scope.backToSearchAppeal=function() {
      $location.path("/volunteer/appeals");
    }
    $scope.volSignup= function(need_flexi_id,projectId) {
      $window.location.href = CRM.url("civicrm/volunteer/signup", "reset=1&needs[]="+need_flexi_id+"&dest=list");
    }
  });
})(angular, CRM.$, CRM._);