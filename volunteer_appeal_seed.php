<?php

echo (" Start Script for Create Appeal  . . . ");

/**
 * Root directory of Drupal installation.
 */
define('DRUPAL_ROOT', getcwd());

require_once DRUPAL_ROOT . '/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

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