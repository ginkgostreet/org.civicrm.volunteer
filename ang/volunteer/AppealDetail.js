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
         }
      });
    }
  );

  
  angular.module('volunteer').controller('VolunteerAppealDetail', function ($scope,crmApi,projectAppealsData,$window) {
    var ts = $scope.ts = CRM.ts('org.civicrm.volunteer');
    $scope.basepath=$window.location.origin+Drupal.settings.basePath+"sites/default/files/civicrm/ext/org.civicrm.volunteer/img/";      
	  $scope.appeal = appeal; 
    $scope.showShift = parseInt(appeal.display_volunteer_shift);
    $scope.locAny= parseInt(appeal.location_done_anywhere); 
    $scope.showVolunteer=parseInt(appeal.hide_appeal_volunteer_button); 
    $scope.redirectTo=function(projectId) {  
        $window.location.href = $window.location.origin+Drupal.settings.basePath+"civicrm/vol/#/volunteer/opportunities?project="+projectId;
    }
	
  });
})(angular, CRM.$, CRM._);