(function(angular, $, _) {

  angular.module('volunteer').config(function($routeProvider) {
      $routeProvider.when('/volunteer/project_appeals/:projectId', {
        controller: 'VolunteerAppeal',
        templateUrl: '~/volunteer/Appeals.html',
        resolve: {
          projectAppealsData: function(crmApi, $route) {
            return crmApi('VolunteerAppeal', 'get', {
              project_id: $route.current.params.projectId,
            }).then(function (data) {              
              let projectAppeals=[];              
              for(let key in data.values) {
                projectAppeals.push(data.values[key]);
              }
              return projectAppeals;              
            },function(error) {
              if (error.is_error) {
                CRM.alert(error.error_message, ts("Error"), "error");
              } else {
                return error;
              }
            });
          }
        }
      });
    }
  );

  angular.module('volunteer').controller('VolunteerAppeal', function ($scope,crmApi,crmUiAlert,$route, projectAppealsData) {
    var ts = $scope.ts = CRM.ts('org.civicrm.volunteer');
    //assign project id from url.
    $scope.projectId = $route.current.params.projectId;
    // Get current date for filter data for expired appeal and active appeal.
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    // today_date contains date with 2019-06-13 format.
    $scope.today_date = yyyy + '-' + mm + '-' + dd;

    /*
    * Manage code for Active appeal table.
    **/
    $scope.propertyName = 'active_todate';
    $scope.reverse = false;
    $scope.appeals = projectAppealsData;

    // Sort function for active appeal table.
    $scope.sortBy = function(propertyName) {
      $scope.reverse = ($scope.propertyName === propertyName) ? !$scope.reverse : false;
      $scope.propertyName = propertyName;
    };

    /*
    * Manage code for expired appeal table.
    **/
    $scope.propertyNameExpiredTable = 'active_todate';
    $scope.reverseExpiredTable = false;
    $scope.expired_appeals = projectAppealsData;

    // Sort function for expired appeal table.
    $scope.sortByExpiredTable = function(propertyNameExpiredTable) {
      $scope.reverseExpiredTable = ($scope.propertyNameExpiredTable === propertyNameExpiredTable) ? !$scope.reverseExpiredTable : false;
      $scope.propertyNameExpiredTable = propertyNameExpiredTable;
    };

    /*
    * Update Appeal status.
    * Set appeal status like is active or not.
    *
    **/
    $scope.updateAppeal = function ($event, id, project_id) {
      var checkbox = $event.target;
      var appeal = {};
      appeal.id = id;
      if(checkbox.checked) {
        appeal.is_appeal_active = 1;
      } else {
        appeal.is_appeal_active = 0;
      }
      appeal.project_id = project_id;
      var appealId = crmApi('VolunteerAppeal', 'create', appeal).then(
        function(success) {
          return success.values.id;
        },
        function(fail) {
          var text = ts('Your submission was not saved. Resubmitting the form is unlikely to resolve this problem. Please contact a system administrator.');
          var title = ts('A technical problem has occurred');
          crmUiAlert({text: text, title: title, type: 'error'});
        }
      );
      if (appealId) {
        crmUiAlert({text: ts('Appeal Updated successfully'), title: ts('Updated'), type: 'success'});
      }
    };

    /*
    * This function is used for delete appeal.
    * Pass appeal Id in function.
    * Using delete API for delete appeal.
    * Remove that element from table.
    **/
    $scope.deleteAppeal = function (id) {
      CRM.confirm({message: ts("Are you sure you want to Delete the Appeal?")}).on('crmConfirm:yes', function() {
        crmApi("VolunteerAppeal", "delete", {id: id}, true).then(function() {
          let appeals_details = $scope.appeals;
          // Remove that element from table based on id without page load.
          $scope.appeals = appeals_details.filter(function( obj ) {
            return obj.id !== id;
          });
        });
      });
    };
  });
  // https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
  if (!String.prototype.padStart) {
      String.prototype.padStart = function padStart(targetLength,padString) {
          targetLength = targetLength>>0; //truncate if number or convert non-number to 0;
          padString = String((typeof padString !== 'undefined' ? padString : ' '));
          if (this.length > targetLength) {
              return String(this);
          }
          else {
              targetLength = targetLength-this.length;
              if (targetLength > padString.length) {
                  padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
              }
              return padString.slice(0,targetLength) + String(this);
          }
      };
  }
  if (!String.prototype.repeat) {
    String.prototype.repeat = function(count) {
      'use strict';
      if (this == null) {
        throw new TypeError('can\'t convert ' + this + ' to object');
      }
      var str = '' + this;
      count = +count;
      if (count != count) {
        count = 0;
      }
      if (count < 0) {
        throw new RangeError('repeat count must be non-negative');
      }
      if (count == Infinity) {
        throw new RangeError('repeat count must be less than infinity');
      }
      count = Math.floor(count);
      if (str.length == 0 || count == 0) {
        return '';
      }
      // Ensuring count is a 31-bit integer allows us to heavily optimize the
      // main part. But anyway, most current (August 2014) browsers can't handle
      // strings 1 << 28 chars or longer, so:
      if (str.length * count >= 1 << 28) {
        throw new RangeError('repeat count must not overflow maximum string size');
      }
      var maxCount = str.length * count;
      count = Math.floor(Math.log(count) / Math.log(2));
      while (count) {
         str += str;
         count--;
      }
      str += str.substring(0, maxCount - str.length);
      return str;
    }
  }

})(angular, CRM.$, CRM._);