(function (angular, $, _) {

  angular.module('volunteer').config(function ($routeProvider) {
    $routeProvider.when('/volunteer/appeals', {
      controller: 'VolApplsCtrl',
      // update the search params in the URL without reloading the route     
      templateUrl: '~/volunteer/VolApplsCtrl.html'
    });
  });

  angular.module('volunteer').controller('VolApplsCtrl', function ($route, $scope,crmApi,$window) {       
      var ts = $scope.ts = CRM.ts('org.civicrm.volunteer');
      $scope.search="";           
      $scope.currentTemplate = "~/volunteer/AppealGrid.html"; //default view is grid view
      $scope.totalRec;
      $scope.currentPage = 1;
      $scope.pageSize = 2;
      $scope.options=[{key:"titleA",val:"Title A-Z"},{key:"titleD",val:"Title Z-A"},{key:"dateS",val:"Newest Appeals"},{key:"dateE",val:"Upcoming"},{key:"benfcrA",val:"Project Beneficiary A-Z"},{key:"benfcrD",val:"Project Beneficiary Z-A"}]; 
      $scope.sortValue=$scope.sortby=$scope.order=null;
      $scope.basepath=$window.location.origin+Drupal.settings.basePath+"sites/default/files/civicrm/ext/org.civicrm.volunteer/img/";
      //Change reult view
      $scope.changeview = function(tpl){
        $scope.currentTemplate = tpl;        
      }

      //Get appeal data with search text and/or pagination
      getAppeals = function (currentPage,search,orderby,order) {       
        let params={};        
        $scope.currentPage?params.page_no=$scope.currentPage:null; 
        $scope.search?params.search_appeal=$scope.search:null;
        $scope.sortby?params.orderby=$scope.sortby:null;
        $scope.order?params.order=$scope.order:null;        
        return crmApi('VolunteerAppeal', 'getsearchresult', params)
         .then(function (data) {          
              let projectAppeals=[];              
              for(let key in data.values.appeal) {
                projectAppeals.push(data.values.appeal[key]);
              }            
              $scope.appeals=projectAppeals;
              $scope.totalRec=data.values.total_appeal;              
              $scope.numberOfPages= Math.ceil($scope.totalRec/$scope.pageSize);            
            },function(error) {
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
       //getAppeals($scope.currentPage,$scope.search);
     }

     //sort title,dates,beneficiaries by asc and desc
     $scope.sort=function(){
      $scope.currentPage = 1;
      checkAndSetSortValue();      
      getAppeals();
     }

     //Set sort by and order by according to value selected
     function checkAndSetSortValue() {
      let sortby,orderby=null;
      if($scope.sortValue.key=="titleA"){
        sortby="title";
        orderby="ASC";
      } else if ($scope.sortValue.key=="titleD"){
        sortby="title";
        orderby="DESC";
      } else if($scope.sortValue.key=="dateS"){
        sortby="active_fromdate";
        orderby="ASC";
      } else if($scope.sortValue.key=="dateE"){
        sortby="active_todate";
        orderby="DESC";
      }else if(sortValue.key=="benfcrA"){
         sortBy="project_beneficiary";
        orderby="ASC";
      } else if(sortValue.key=="benfcrD"){
         sortBy="project_beneficiary";
         orderby="DESC";
      }
      $scope.sortby=sortby;
      $scope.order=orderby;
     }

     $scope.redirectTo=function(appealId) {      
        $window.location.href = $window.location.origin+Drupal.settings.basePath+"civicrm/vol/#/volunteer/appeal/"+appealId;
     }

  });

})(angular, CRM.$, CRM._);
