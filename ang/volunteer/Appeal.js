(function(angular, $, _) {

  angular.module('volunteer').config(function($routeProvider) {
      $routeProvider.when('/volunteer/manage_appeal/:projectId/:appealId', {
        controller: 'VolunteerCreateAppeal',
        templateUrl: '~/volunteer/Appeal.html',
        resolve: {
          countries: function(crmApi) {
            return crmApi('VolunteerUtil', 'getcountries', {}).then(function(result) {
              return result.values;
            });
          },
          appeal: function(crmApi, $route) {
            if ($route.current.params.appealId == 0) {
              return {
                id: 0
              };
            } else {
              return crmApi('VolunteerAppeal', 'getsingle', {
                id: $route.current.params.appealId,
                projectId: $route.current.params.projectId,
                return: ['custom']
              }).then(
                // success
                null,
                // error
                function () {
                  CRM.alert(
                    ts('No volunteer appeal exists with an ID of %1', {1: $route.current.params.appealId}),
                    ts('Not Found'),
                    'error'
                  );
                }
              );
            }
          },
          project: function(crmApi, $route) {
            return crmApi('VolunteerProject', 'getsingle', {
              id: $route.current.params.projectId,
              return: ['custom']
            }).then(
              // success
              null,
              // error
              function () {
                CRM.alert(
                  ts('No volunteer project exists with an ID of %1', {1: $route.current.params.projectId}),
                  ts('Not Found'),
                  'error'
                );
              }
            );
          },
          supporting_data: function(crmApi, $route) {
            return crmApi('VolunteerUtil', 'getsupportingdata', {
              controller: 'VolunteerAppeal',
              appeal_id: $route.current.params.appealId
            });
          },
          custom_fieldset_volunteer: function(crmApi) {
            return crmApi('VolunteerUtil', 'getCustomFieldsetVolunteer', {
              controller: 'VolunteerAppeal'
            });
          },
          location_blocks: function(crmApi) {
            return crmApi('VolunteerProject', 'locations', {});
          }
        }
      });
    }
  );

  angular.module('volunteer').controller('VolunteerCreateAppeal', function($scope, $sce, $location, $q, $route, crmApi, crmUiAlert, crmUiHelp, countries, appeal, project, supporting_data, location_blocks, volBackbone, custom_fieldset_volunteer, $compile) {

    /**
     * We use custom "dirty" logic rather than rely on Angular's native
     * functionality because we need to make a separate API call to
     * create/update the locBlock object (a distinct entity from the project)
     * if any of the locBlock fields have changed, regardless of whether other
     * form elements are dirty.
     */
    $scope.locBlockIsDirty = false;

    /**
     * This flag allows the code to distinguish between user- and
     * server-initiated changes to the locBlock fields. Without this flag, the
     * changes made to the locBlock fields when a location is fetched from the
     * server would cause the watch function to mark the locBlock dirty.
     */
    $scope.locBlockSkipDirtyCheck = false;

    // The ts() and hs() functions help load strings for this module.
    var ts = $scope.ts = CRM.ts('org.civicrm.volunteer');
    var hs = $scope.hs = crmUiHelp({file: 'CRM/Volunteer/Form/Volunteer'}); // See: templates/CRM/volunteer/Project.hlp

    /**
     * Set form default value when create appeal or edit appeal page is open.
     */
    setFormDefaults = function() {
      if(appeal.id == 0) {
        // In Create Appeal form Appeal location value should be project location.
        appeal.loc_block_id = project.loc_block_id;
        // Is Appeal Active Checkbox by default set as 1.
        appeal.is_appeal_active = 1;
      }
      // Get project Id from url.
      appeal.project_id = $route.current.params.projectId;
    };

    // Set Default Form Data when page is loaded.
    setFormDefaults();

    if (CRM.vars['org.civicrm.volunteer'] && CRM.vars['org.civicrm.volunteer'].context) {
      $scope.formContext = CRM.vars['org.civicrm.volunteer'].context;
    } else {
      $scope.formContext = 'standAlone';
    }

    switch ($scope.formContext) {
      case 'eventTab':
        volBackbone.load();
        var cancelCallback = function (projectId) {
          CRM.$("body").trigger("volunteerProjectCancel");
        };
        $scope.saveAndNextLabel = ts('Save');
        break;

      default:
        var cancelCallback = function (projectId) {
          $location.path("/volunteer/manage");
        };
        $scope.saveAndNextLabel = ts('Save and Add Another Appeal');
    }
    $scope.project = project;
    $scope.countries = countries;
    $scope.locationBlocks = location_blocks.values;
    $scope.locationBlocks[0] = "Create a new Location";
    $scope.locBlock = {};
    appeal.is_appeal_active = (appeal.is_appeal_active == "1");
    appeal.display_volunteer_shift = (appeal.display_volunteer_shift == "1");
    appeal.hide_appeal_volunteer_button = (appeal.hide_appeal_volunteer_button == "1");
    $scope.custom_fieldset_group = custom_fieldset_volunteer.values;
    $scope.supporting_data = supporting_data.values;
    // Manage action of appeal form.
    if(appeal.id == 0) {
      appeal.action = "Create";
      $scope.supporting_data.appeal_custom_field_groups = [];
    } else {
      appeal.action = "Edit";
      if(appeal.location_done_anywhere == 1) {
        appeal.location_done_anywhere = true;
      } else {
        appeal.location_done_anywhere = false;
      }
      delete appeal.contact_id;
      appeal.old_image = appeal.image;

      /*
       * Set default value of custom group dropdown when edit appeal page open.
       * remove custom group from dropdown if user have already set any custom group.
       */
      setTimeout(function() {
        var available_custom_fieldsets = [];
        for (var key in supporting_data.values.appeal_custom_field_groups) {
          var group_id = supporting_data.values.appeal_custom_field_groups[key].collectionId;
          available_custom_fieldsets['custom_'+group_id] = group_id;
          // Manage delete icon for specific custom field group.
          var group_name = supporting_data.values.appeal_custom_field_groups[key].name;
          var group_title = supporting_data.values.appeal_custom_field_groups[key].title;
          // Prepare delete icon for added custom group.
          var deleteCustomGroupHtml = '<a id="customGroupId_'+group_id+'" class="crm-hover-button crm-button-remove-profile crm-button-remove-custom-group"><span data-grouptitle="'+group_title+'" data-group="'+group_id+'" class="icon ui-icon-circle-close"></span></a>';
          var compiledHtml = $compile(deleteCustomGroupHtml)($scope);
          angular.element(document.getElementsByClassName('crmRenderFieldCollection-'+group_name)).prepend(compiledHtml);
          // Add Click Eventlistner for delete icon of custom group and apply that in DOM.
          document.getElementById("customGroupId_"+group_id).addEventListener('click', function(event) {
            $scope.$apply(function() {
              var targetElement = event.target || event.srcElement;
              // Add deleted custom field group in dropdown for adding again.
              var custom_group_id = CRM.$(targetElement).data("group");
              var grouptitle = CRM.$(targetElement).data("grouptitle");
              $scope.custom_fieldset_group[custom_group_id] = {id:custom_group_id, title:grouptitle};

              // Remove custom field group from UI.
              for (var key in $scope.supporting_data.appeal_custom_field_groups) {
                // check if the property/key is defined in the object itself, not in parent
                if ($scope.supporting_data.appeal_custom_field_groups.hasOwnProperty(key)) {
                  if(custom_group_id == $scope.supporting_data.appeal_custom_field_groups[key].collectionId) {
                    // Unset selected field when delete group called.
                    var custom_field_selected_keys = Object.keys($scope.supporting_data.appeal_custom_field_groups[key].fields);
                    for (var obj_key in custom_field_selected_keys) {
                      var custom_field_value = custom_field_selected_keys[obj_key];
                      // Unset data for that value when delete group icon clicked.
                      $scope.appeal[custom_field_value] = "";
                    }
                    // Remove custom field group from UI.
                    $scope.supporting_data.appeal_custom_field_groups.splice(key, 1);
                  }
                }
              }
            });
          });
        }
        // Remove custom field set from dropdown which were set already.
        for (var key in custom_fieldset_volunteer.values) {
          var custom_field_id_exist = custom_fieldset_volunteer.values[key].id;
          if(available_custom_fieldsets['custom_'+custom_field_id_exist]) {
            delete $scope.custom_fieldset_group[custom_field_id_exist];
          }
        }
      }, 1000);
    }
    $scope.relationship_types = supporting_data.values.relationship_types;
    $scope.phone_types = supporting_data.values.phone_types;
    $scope.appeal = appeal;
    $scope.showProfileBlock = CRM.checkPerm('edit volunteer registration profiles');
    $scope.showRelationshipBlock = CRM.checkPerm('edit volunteer project relationships');
 
    /**
     * Populates locBlock fields based on user selection of location.
     *
     * Makes an API request.
     *
     * @see $scope.locBlockIsDirty
     * @see $scope.locBlockSkipDirtyCheck
     */
    $scope.refreshLocBlock = function() {
      if (!!$scope.appeal.loc_block_id) {
        crmApi("VolunteerProject", "getlocblockdata", {
          "return": "all",
          "sequential": 1,
          "id": $scope.appeal.loc_block_id
        }).then(function(result) {
          if(!result.is_error) {
            $scope.locBlockSkipDirtyCheck = true;
            $scope.locBlock = result.values[0];
            $scope.locBlockIsDirty = false;
          } else {
            CRM.alert(result.error);
          }
        });
      }
    };
    //Refresh as soon as we are up and running because we don't have this data yet.
    $scope.refreshLocBlock();

    /**
     * If the user selects the option to create a new locBlock (id = 0), set
     * some defaults and display the necessary fields. Otherwise, fetch the
     * location data so we can display it for editing.
     */
    $scope.$watch('appeal.loc_block_id', function (newValue) {
      if (newValue == 0) {
        $scope.locBlock = {
          address: {
            country_id: _.findWhere(countries, {is_default: "1"}).id
          }
        };

        $("#crm-vol-location-block .crm-accordion-body").slideDown({complete: function() {
          $("#crm-vol-location-block .crm-accordion-wrapper").removeClass("collapsed");
        }});
      } else {
        //Load the data from the server.
        $scope.refreshLocBlock();
      }
    });

    /**
     * @see $scope.locBlockIsDirty
     * @see $scope.locBlockSkipDirtyCheck
     */
    $scope.$watch('locBlock', function(newValue, oldValue) {
      if ($scope.locBlockSkipDirtyCheck) {
        $scope.locBlockSkipDirtyCheck = false;
      } else {
        $scope.locBlockIsDirty = true;
      }
    }, true);

    /**
     * Validate form field when appeal form submit.
     * Validate required field validation for some of the fields.
     */
    $scope.validate = function() {
      var valid = true;
      
      if(!$scope.appeal.title) {
        CRM.alert(ts("Title is a required field"), "Required");
        valid = false;
      }
      if(!$scope.appeal.image) {
        CRM.alert(ts("Appeal Image is a required field"), "Required");
        valid = false;
      }
      if(!$scope.appeal.appeal_description) {
        CRM.alert(ts("Appeal Description is a required field"), "Required");
        valid = false;
      }
      if($scope.locBlockIsDirty && !$scope.appeal.loc_block_id && !appeal.location_done_anywhere) {
        CRM.alert(ts("Appeal Location is a required field"), "Required");
        valid = false;  
      }
      
      valid = (valid);

      return valid;
    };

  
    /**
     * Helper function which serves as a harness for the API calls which
     * constitute form submission.
     *
     * TODO: The value of loc_block_id is a little too magical. "" means the
     * location is empty. "0" means the location is new, i.e., about to be
     * created. Any other int-like string represents the ID of an existing
     * location. This magic could perhaps be encapsulated in a function whose
     * job it is to return an operation: "create" or "update."
     *
     * @returns {Mixed} Returns project ID on success, boolean FALSE on failure.
     */
    doSave = function() {
      if ($scope.validate()) {
        // When the loc block ID is an empty string, it indicates that the
        // location is blank. Thus, there is no loc block to create/edit.
        if ($scope.locBlockIsDirty && $scope.appeal.loc_block_id !== "") {
          // pass an ID only if we are updating an existing locblock
          $scope.locBlock.id = $scope.appeal.loc_block_id === "0" ? null : $scope.appeal.loc_block_id;
          return crmApi('VolunteerProject', 'savelocblock', $scope.locBlock).then(
            // success
            function (result) {
              $scope.appeal.loc_block_id = result.id;
              return _saveAppeal();
            },
            // failure
            function(result) {
              crmUiAlert({text: ts('Failed to save location details. Appeal could not be saved.'), title: ts('Error'), type: 'error'});
              console.log('api.VolunteerProject.savelocblock failed with the following message: ' + result.error_message);
            }
          );
        } else {
          return _saveAppeal();
        }
      } else {
        return $q.reject(false);
      }
    };

    /**
     * Helper function which saves a volunteer project appeal.
     *
     * @returns {Mixed} Returns appeal ID on success.
     */
    _saveAppeal = function() {
      // Zero is a bit of a magic number the form uses to connote creation of
      // a new location; this value should never be passed to the API.
      if ($scope.appeal.loc_block_id === "0") {
        delete $scope.appeal.loc_block_id;
      }
      // Set the value of parameter based on selection.
      appeal.image = $scope.appeal.image;
      appeal.is_appeal_active = $scope.appeal.is_appeal_active;
      appeal.display_volunteer_shift = $scope.appeal.display_volunteer_shift;
      appeal.hide_appeal_volunteer_button = $scope.appeal.hide_appeal_volunteer_button;
      if(!appeal.location_done_anywhere) {
        appeal.location_done_anywhere = 0;
      } else {
        appeal.location_done_anywhere = 1;
        appeal.loc_block_id = "";
      }
      if(!appeal.is_appeal_active) {
        appeal.is_appeal_active = 0;
      } else {
        appeal.is_appeal_active = 1;
      }
      if(!appeal.display_volunteer_shift) {
        appeal.display_volunteer_shift = 0;
      } else {
        appeal.display_volunteer_shift = 1;
      }
      if(!appeal.hide_appeal_volunteer_button) {
        appeal.hide_appeal_volunteer_button = 0;
      } else {
        appeal.hide_appeal_volunteer_button = 1;
      }
      return crmApi('VolunteerAppeal', 'create', $scope.appeal).then(
        function(success) {
          return success.values.id;
        },
        function(fail) {
          var text = ts('Your submission was not saved. Resubmitting the form is unlikely to resolve this problem. Please contact a system administrator.');
          var title = ts('A technical problem has occurred');
          crmUiAlert({text: text, title: title, type: 'error'});
          console.log('api.VolunteerProject.create failed with the following message: ' + fail.error_message);
        }
      );
    };

    /**
     * This function is used for save appeal and then go back to listing page of appeals.
     */
    $scope.saveAndDone = function () {
      doSave().then(function (appealId) {
        if (appealId) {
          crmUiAlert({text: ts('Changes saved successfully'), title: ts('Saved'), type: 'success'});
          $location.path("/volunteer/manage_appeals");
        }
      });
    };

    /**
     * This function is used for save appeal and then go back to same page for adding new appeal for specific project.
     */
    $scope.saveAndNext = function() {
      doSave().then(function(appealId) {
        if (appealId) {
          crmUiAlert({text: ts('Changes saved successfully'), title: ts('Saved'), type: 'success'});
          $route.reload();
          //saveAndNextCallback(appealId);
        }
      });
    };

    $scope.cancel = function() {
      cancelCallback();
    };

    $scope.previewDescription = function() {
      CRM.alert($scope.appeal.appeal_description, $scope.appeal.title, 'info', {expires: 0});
    };

    //Handle Refresh requests
    CRM.$("body").on("volunteerProjectRefresh", function() {
      $route.reload();
    });

    /*
     * This function is used for manage uplaod image of appeal.
     * First its convert into base64 and pass that string into api.
     */
    $scope.uploadFile = function (e) {
      
      var file = e.target.files[0];
      var reader  = new FileReader();
      reader.onloadend = function () {
        $scope.appeal.image_data = reader.result;
      }
      reader.readAsDataURL(file);
      $scope.appeal.image = "";
      if(e.target.files[0]) {
        var file_name = e.target.files[0].name;
        $scope.appeal.image = file_name;
      }
    };

    /*
     * This function is used for display selected custom group.
     * Makes an API request.
     * add that group in appeal_custom_field_groups object.
     */
    $scope.customFieldSetDisplay = function() {
      let item = $scope.customFieldSetSelected;
      if(item) {
        // Get the custom group id and title.
        var custom_fieldset_id = item.id;
        var custom_fieldset_title = item.title;
        // Fetch new custom group detail based on that ID and display in UI.
        crmApi("VolunteerUtil", "getsupportingdata", {
          controller: 'VolunteerAppeal',
          custom_fieldset_id : custom_fieldset_id
        }).then(function(result) {
          if(!result.is_error) {
            // Add New Customfield group in UI.
            $scope.customFieldSetData = result.values.appeal_custom_field_groups;
            if(result.values.appeal_custom_field_groups[0]) {

              $scope.supporting_data.appeal_custom_field_groups.push(result.values.appeal_custom_field_groups[0]);

              // Delete selected custom group from dropdown.
              delete $scope.custom_fieldset_group[custom_fieldset_id];

              // Add Delete Icon for remove selected custom group and manage delete action for that.
              setTimeout(function() {
                // Manage delete icon for specific custom field group.
                var group_name = result.values.appeal_custom_field_groups[0].name;
                var group_title = result.values.appeal_custom_field_groups[0].title;
                // Prepare delete icon for added custom group.
                var deleteCustomGroupHtml = '<a id="customGroupId_'+custom_fieldset_id+'" class="crm-hover-button crm-button-remove-profile crm-button-remove-custom-group"><span data-grouptitle="'+group_title+'" data-group="'+custom_fieldset_id+'" class="icon ui-icon-circle-close"></span></a>';
                var compiledHtml = $compile(deleteCustomGroupHtml)($scope);
                angular.element(document.getElementsByClassName('crmRenderFieldCollection-'+group_name)).prepend(compiledHtml);

                // Add Click Eventlistner for delete icon of custom group and apply that in DOM.
                document.getElementById("customGroupId_"+custom_fieldset_id).addEventListener('click', function(event) {
                  $scope.$apply(function() {
                    var targetElement = event.target || event.srcElement;
                    // Add deleted custom field group in dropdown for adding again.
                    var custom_group_id = CRM.$(targetElement).data("group");
                    var grouptitle = CRM.$(targetElement).data("grouptitle");
                    $scope.custom_fieldset_group[custom_group_id] = {id:custom_group_id, title:grouptitle};

                    // Remove custom field group from UI.
                    for (var key in $scope.supporting_data.appeal_custom_field_groups) {
                      // check if the property/key is defined in the object itself, not in parent
                      if ($scope.supporting_data.appeal_custom_field_groups.hasOwnProperty(key)) {
                        if(custom_group_id == $scope.supporting_data.appeal_custom_field_groups[key].collectionId) {
                          var custom_field_selected_keys = Object.keys($scope.supporting_data.appeal_custom_field_groups[key].fields);
                          // Unset data for that value when delete group icon clicked.
                          for (var obj_key in custom_field_selected_keys) {
                            var custom_field_value = custom_field_selected_keys[obj_key];
                            // Unset data for that value when delete group icon clicked.
                            $scope.appeal[custom_field_value] = "";
                          }
                          // Remove custom field group from UI.
                          $scope.supporting_data.appeal_custom_field_groups.splice(key, 1);
                        }
                      }
                    }
                  });
                });
              }, 1000);
            }
          } else {
            CRM.alert(result.error);
          }
        });
      }
    };
  });
})(angular, CRM.$, CRM._);