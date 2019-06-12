<?php
use CRM_Volunteer_ExtensionUtil as E;

/**
 * VolunteerAppeal.create API specification (optional)
 * This is used for documentation and validation.
 *
 * @param array $spec description of fields supported by this API call
 * @return void
 * @see https://docs.civicrm.org/dev/en/latest/framework/api-architecture/
 */
function _civicrm_api3_volunteer_appeal_create_spec(&$spec) {
  // $spec['some_parameter']['api.required'] = 1;
}

/**
 * Create or update a appeal
 *
 * @param array $params  Associative array of property
 *                       name/value pairs to insert in new 'appeal'
 * @example
 *
 * @return array api result array
 * {@getfields volunteer_appeal_create}
 * @access public
 */
function civicrm_api3_volunteer_appeal_create($params) {
  
  $appeal = CRM_Volunteer_BAO_VolunteerAppeal::create($params);
  
  return civicrm_api3_create_success($appeal->toArray(), $params, 'VolunteerAppeal', 'create');
}

/**
 * VolunteerAppeal.delete API
 *
 * @param array $params
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_volunteer_appeal_delete($params) {
  return _civicrm_api3_basic_delete(_civicrm_api3_get_BAO(__FUNCTION__), $params);
}

/**
 * VolunteerAppeal.get API
 *
 * @param array $params
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_volunteer_appeal_get($params) { 
	//$params["check_permissions"] = 0;	
	$result = CRM_Volunteer_BAO_VolunteerAppeal::retrieve($params);
  foreach ($result as $k => $bao) {  	
    $result[$k] = $bao->toArray();
    $result[$k]['entity_attributes'] = $bao->getEntityAttributes();
  }	
  return civicrm_api3_create_success($result, $params, 'VolunteerAppeal', 'get');
}

/**
 * VolunteerAppeal.getAppealData API
 *
 * @param array $params
 * @return array API result descriptor
 * @throws API_Exception
 */
function civicrm_api3_volunteer_appeal_getAppealData($params) {
	$id = $params['id'];
	$result = CRM_Volunteer_BAO_VolunteerAppeal::retrieveByID($id);
	
	return civicrm_api3_create_success($result, $params, 'VolunteerAppeal', 'getSingle');
}

/**
 * Returns the results of a search.
 *
 * This API is used with the volunteer appeals search UI.
 *
 * @param array $params
 *   See CRM_Volunteer_BAO_VolunteerAppeal::doSearch().
 *
 * @return array
 */
function civicrm_api3_volunteer_appeal_getsearchresult($params) {
  $result = CRM_Volunteer_BAO_VolunteerAppeal::doSearch($params);
  
  return civicrm_api3_create_success($result, $params, 'VolunteerAppeal', 'getsearchresult');
}
