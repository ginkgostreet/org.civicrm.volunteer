<?php

define('PROJECT_SKILL_GROUP_ID', 8);
define('APPEAL_SKILL_GROUP_ID', 14);

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
