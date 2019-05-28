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
      $scope.pageSize = 10;
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
        orderby="DESC";
      } else if($scope.sortValue.key=="dateE"){
        sortby="upcoming_appeal";
        orderby="DESC";
      }else if($scope.sortValue.key=="benfcrA"){
         sortBy="project_beneficiary";
        orderby="ASC";
      } else if($scope.sortValue.key=="benfcrD"){
         sortBy="project_beneficiary";
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
      }else {
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
    else{
      return false;
    }
  }

  /*$scope.openCity=function(event, cityName) {
  var i, tabcontent, tablinks;
  tabcontent = angular.element(document.querySelector(".tabcontent"));//document.getElementsByClassName("tabcontent"); 
  console.log(tabcontent);
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = angular.element(document.querySelector(".tablinks"));//document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(cityName).style.display = "block";
  $(event.target).addClass('active');
  //evt.currentTarget.className += " active";
}

  // Get the element with id="defaultOpen" and click on it
  document.getElementById("defaultOpen").click();*/

  });

})(angular, CRM.$, CRM._);


// function openCity(evt, cityName) {
//   var i, tabcontent, tablinks;
//   tabcontent = angular.element(document.querySelector(".tabcontent"));//document.getElementsByClassName("tabcontent");
//   for (i = 0; i < tabcontent.length; i++) {
//     tabcontent[i].style.display = "none";
//   }
//   tablinks = angular.element(document.querySelector(".tablinks"));//document.getElementsByClassName("tablinks");
//   for (i = 0; i < tablinks.length; i++) {
//     tablinks[i].className = tablinks[i].className.replace(" active", "");
//   }
//   document.getElementById(cityName).style.display = "block";
//   evt.currentTarget.className += " active";
// }

// // Get the element with id="defaultOpen" and click on it
// document.getElementById("defaultOpen").click();