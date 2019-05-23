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

  // TODO for VOL-276: Remove reference to beneficiaries object, based on deprecated API.
  angular.module('volunteer').controller('VolunteerAppealDetail', function ($scope,crmApi,projectAppealsData) {
    var ts = $scope.ts = CRM.ts('org.civicrm.volunteer');
    //var hs = $scope.hs = crmUiHelp({file: 'CRM/volunteer/Projects'}); // See: templates/CRM/volunteer/Projects.hlp
	$scope.appeal = appeal;
	
  });
})(angular, CRM.$, CRM._);