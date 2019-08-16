<?php

/**
 * Root directory of Drupal installation.
 */
define('DRUPAL_ROOT', getcwd());

require_once DRUPAL_ROOT . '/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

civicrm_initialize();

// Fetch CustomGroup Config
$projectFields = civicrm_api3('CustomGroup', 'getSingle', array(
	'name' => "Project_Skills",
	'api.CustomField.get' => array(
		'options' => ['limit' => 0], 
		'return' => array(
			"custom_group_id", "name", "label", "data_type", "html_type", "default_value", "weight", "is_required", "is_searchable", "text_length", "is_active", "option_group_id"
			)
		)
	)
);

civicrm_api3('CustomGroup', 'create', [
	'title' => "Opportunity Skills",
	'extends' => "VolunteerAppeal",
]);

$group = civicrm_api3('CustomGroup', 'getsingle', array('name' => "Opportunity_Skills", "return" => ["id"] ));

copyFieldsTo($projectFields['api.CustomField.get']['values'], $group['id']);

civicrm_api3('CustomGroup', 'create', [
	'title' => "Opportunity Impact",
	'extends' => "VolunteerAppeal",
]);

$group = civicrm_api3('CustomGroup', 'getsingle', array('name' => "Opportunity_Impact", "return" => ["id"] ));

$impact = civicrm_api3('CustomField', 'getsingle', [
	'custom_group_id' => "Organization_Information",
	'name' => "Primary_Impact_Area",
]);

$impact['name'] = 'Area_of_Impact';
$impact['label'] = 'Area of Impact';

copyFieldsTo([$impact], $group['id']);

die("<h1>Success</h1>");

function copyFieldsTo($fields, $groupId) {
	echo "<pre>";
	foreach($fields as $conf) {
		unset($conf['id']);
		$conf['custom_group_id'] = $groupId;
		var_dump(civicrm_api3('CustomField', 'create', $conf));
	}
	echo "</pre>";
}
  