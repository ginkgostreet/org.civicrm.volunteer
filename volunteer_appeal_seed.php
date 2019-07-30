<?php

define('PROJECT_SKILL_GROUP_ID', 8);
define('APPEAL_SKILL_GROUP_ID', 14);

echo (" Start Script for Create Appeal  . . . ");

/**
 * Root directory of Drupal installation.
 */
define('DRUPAL_ROOT', getcwd());

require_once DRUPAL_ROOT . '/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

civicrm_initialize();

$result = civicrm_api3('CustomGroup', 'get', [
  'sequential' => 1,
  'id' => PROJECT_SKILL_GROUP_ID,
]);
$group_name = "";
$configuration = array();
if(isset($result) && !empty($result)) {
    foreach ($result['values'] as $key => $group) {
        $custom_field_for_custom_group = civicrm_api3('CustomField', 'get', [
          'sequential' => 1,
          'custom_group_id' => $group["name"],
        ]);
        if($custom_field_for_custom_group['values']) {
            foreach ($custom_field_for_custom_group['values'] as $custom_field_key => $custom_field) {
                
                $custom_field_name = $custom_field['name'];
                $html_type = $custom_field['html_type'];
                $configuration['Opportunity_Skills'][$custom_field_name]['custom_field_detail'] = $custom_field;
            }
        }
    }
}

foreach($configuration as $title => $group_vals) {
    // Create fields    
    foreach ($group_vals as $title => $field_vals) {
      $custom_field_data = $field_vals['custom_field_detail'];
            
      create_custom_field($title, $field_vals, $custom_field_data);
    }
}


function get_custom_field_info($name) {
  
  $params = array(
      'version' => 3,
      'name' =>  str_replace(' ', '_', $name),
  );
  $result = civicrm_api('custom_field', 'get', $params);
  
  return $result;
}

function create_custom_field($title, $options, $custom_field_data){
  $data_type = $custom_field_data['data_type'];
  $default_value = "";
  $weight = $custom_field_data['weight'];
  $is_required = $custom_field_data['is_required'];
  $is_searchable = $custom_field_data['is_searchable'];
  $is_active = $custom_field_data['is_active'];
  $version = isset($custom_field_data['version']) ? $custom_field_data['version'] : "";
  $text_length = isset($custom_field_data['text_length']) ? $custom_field_data['text_length'] : "";
  $html_type = $custom_field_data['html_type'];
  $option_group_id = $custom_field_data['option_group_id'];
  
  $label = $custom_field_data['label'];
  $name = $custom_field_data['name'];
  
  $params = array(
      'custom_group_id' => APPEAL_SKILL_GROUP_ID,
      'name' => $name,
      'label' => $label,
      'data_type' => $data_type,
      'html_type' => $html_type,
      'default_value' => $default_value,
      'weight' => $weight,    
      'is_required' => $is_required,
      'is_searchable' => $is_searchable,
      'is_active' => $is_active,
      'version' => 3,
      'option_group_id' => $option_group_id,
  );

  $params['text_length'] = $text_length;
  
  $result = civicrm_api( 'custom_field','create',$params );  
  
  return $result;
}

function get_custom_field_group_info($name) {

  $params = array(
      'version' => 3,
      'name' => str_replace(' ', '_', $name),
  );
  $result = civicrm_api('custom_group', 'get', $params);
  return $result;
}

function create_custom_field_group($title, $extends) {

  if (!empty($title)) {
    $params = array( 
      'title' => $title,
//      'name'  => strtolower($title),
      'extends' => $extends,
//      'weight' => $weight,
//      'collapse_display' => 1,
//      'style' => 'Inline',
//       'help_pre' => 'This is Pre Help For Test Group 1',
//       'help_post' => 'This is Post Help For Test Group 1',
      'is_active' => 1,
      'version' => 3,
    );
  
    $result = civicrm_api( 'custom_group','create',$params );
  }
  return $result;
}

// Get disting project ids for creating appeal for that project.
$get_projects_query = db_query("SELECT DISTINCT project_id FROM leaderce_varldev_civicrm.civicrm_volunteer_need WHERE is_active =1 AND project_id IS NOT NULL AND (DATE_ADD(start_time, INTERVAL duration MINUTE) > NOW() OR is_flexible =1 OR duration IS NULL)");
$project_records = $get_projects_query->fetchAll(PDO::FETCH_ASSOC);

// Prepare project details array.
$project_details_array = array();
foreach($project_records as $project) {
    // Get project details based on project id.
    $project_detail_query = db_query("SELECT * FROM leaderce_varldev_civicrm.civicrm_volunteer_project WHERE id = ".$project['project_id']);
    $project_details = (array) $project_detail_query->fetchObject();
    if($project_details['is_active'] == "1") {
        $project_details_array[] = $project_details;
    }
}
// Check needs of that project and create relevant appeal based on that need for that project.
foreach ($project_details_array as $key => $project) {
    // Get needs of project.
    $get_projects_needs_query = db_query("SELECT * FROM leaderce_varldev_civicrm.civicrm_volunteer_need WHERE is_active =1 AND project_id = ".$project['id']." AND (DATE_ADD(start_time, INTERVAL duration MINUTE) > NOW() OR is_flexible =1 OR duration IS NULL)");
    $get_projects_needs = $get_projects_needs_query->fetchAll(PDO::FETCH_ASSOC);
    // If need is set create relevant appeal.
    if(isset($get_projects_needs) && !empty($get_projects_needs)) {
        foreach ($get_projects_needs as $need_key => $need) {
            $appeal_data = array();
            $is_flexible = $need['is_flexible'];
            $is_active = $need['is_active'];
            // If is_flexible and is_active "1" then set display_volunteer_shift and hide_appeal_volunteer_button value "1". Otherwise set to "0".
            if($is_flexible == "0" && $is_active == "1") {
                $display_volunteer_shift = 1;
                $hide_appeal_volunteer_button = 1;
            } else {
                $display_volunteer_shift = 0;
                $hide_appeal_volunteer_button = 0;
            }

            // If location is not set for project "location_done_anywhere" value set to "1" for that appeal.
            if($project['loc_block_id'] == NULL) {
                $location_done_anywhere = 1;
            } else {
                $location_done_anywhere = 0;
            }
            // Set active from date to "Today" date and active to date set "After three months of today date".
            $active_fromdate = date("Y-m-d");
            $active_todate = date('Y-m-d', strtotime("+3 months", strtotime($active_fromdate)));
            // If project description is empty set appeal description is null.
            if(empty($project['description'])) {
                $project['description'] = "";
            }
            // By default active appeal is "1".
            $is_appeal_active = 1;
            $show_project_information = 1;

            // Prepare appeal data in array.
            $appeal_data = array(
                "project_id" => $project['id'],
                "title" => $project['title'],
                "appeal_description" => $project['description'],
                "loc_block_id" => $project['loc_block_id'],
                "location_done_anywhere" => $location_done_anywhere,
                "is_appeal_active" => $is_appeal_active,
                "show_project_information" => $show_project_information,
                "active_fromdate" => $active_fromdate,
                "active_todate" => $active_todate,
                "display_volunteer_shift" => $display_volunteer_shift,
                "hide_appeal_volunteer_button" => $hide_appeal_volunteer_button,
                "image" => "",
                "appeal_teaser" => NULL
            );
            // Create appeal in database.
            $create_appeal = db_insert("leaderce_varldev_civicrm.civicrm_volunteer_appeal")->fields($appeal_data)->execute();
            $appealId = Database::getConnection()->lastInsertId();
            echo "<pre>";
            echo "==========================";
            echo "<pre>";
            print_r("Appeal Id : ".$appealId);
            echo "<pre>";
            print_r("Appeal Title : ".$project['title']);
            echo "<pre>";
            echo "==========================";
            echo "<pre>";
        }
    }
}


echo (" Script Executed . . . ");
exit;