<?php
use CRM_Volunteer_ExtensionUtil as E;

class CRM_Volunteer_BAO_VolunteerAppeal extends CRM_Volunteer_DAO_VolunteerAppeal {

  /**
   * Create a Volunteer Appeal for specific project
   *
   * Takes an associative array and creates a Appeal object. This method is
   * invoked from the API layer.
   *
   * @param array $params
   *   an assoc array of name/value pairs
   *
   * @return CRM_Volunteer_BAO_VolunteerAppeal object
   */
  public static function create(array $params) {
    // Get appeal ID.
    $appealId = CRM_Utils_Array::value('id', $params);
    $projectId = CRM_Utils_Array::value('project_id', $params);

    $op = empty($appealId) ? CRM_Core_Action::ADD : CRM_Core_Action::UPDATE;

    if (!empty($params['check_permissions']) && !CRM_Volunteer_Permission::checkProjectPerms($op, $projectId)) {
      CRM_Utils_System::permissionDenied();

      // FIXME: If we don't return here, the script keeps executing. This is not
      // what I expect from CRM_Utils_System::permissionDenied().
      return FALSE;
    }
    
    // Validate create appeal form parameter.
    $params = self::validateCreateParams($params);
    
   /* Set Image Path for upload image of appeal and uplaod original image and thumb
    * image in folder.
    * Resize image and set 150*150 for thumb image.
    * Thumb image is used for display appeal image on search page.
    */
    // Get the global configuration.
    $config = CRM_Core_Config::singleton();
    // Convert base64 image into image file and Move Upload Image into respective folder.
    $upload_appeal_directory = $config->imageUploadDir.'appeal/';
    $upload_appeal_main_directory = $config->imageUploadDir.'appeal/main/';
    $upload_appeal_thumb_directory = $config->imageUploadDir.'appeal/thumb/';
    // If appeal folder not exist, create appeal folder on civicrm.files folder.
    if (!file_exists($upload_appeal_directory)) {
      mkdir($upload_appeal_directory, 0777, TRUE);
    }
    // If main image folder not exist, create main folder under appeal folder on civicrm.files folder.
    if (!file_exists($upload_appeal_main_directory)) {
      mkdir($upload_appeal_main_directory, 0777, TRUE);
    }
    // If thumb image folder not exist, create thumb folder under appeal folder on civicrm.files folder.
    if (!file_exists($upload_appeal_thumb_directory)) {
      mkdir($upload_appeal_thumb_directory, 0777, TRUE);
    }
    // If new image is updated then resize that image and move that into folder.
    if(isset($params['image_data'])) {
      $image_parts = explode(";base64,", $params['image_data']);
      $image_base64 = base64_decode($image_parts[1]);
      $current_time = time();
      $file = $upload_appeal_main_directory . $current_time."_".$params['image'];
      file_put_contents($file, $image_base64);
      
      // Resize Image with 150*150 and save into destination folder. 
      $source_path = $upload_appeal_main_directory . $current_time."_".$params['image'];
      $destination_path = $upload_appeal_thumb_directory . $current_time."_".$params['image'];
      $imgSmall = image_load($source_path);
      image_resize($imgSmall, 150, 150);
      image_save($imgSmall, $destination_path);
    }
    // If image is not updated on edit page, save old image name in database.
    if($params['image'] == $params['old_image']) {
      $params['image'] = $params['old_image'];
    } else {
      $params['image'] = $current_time."_".$params['image'];
    }

    $appeal = new CRM_Volunteer_BAO_VolunteerAppeal();
    $appeal->copyValues($params);
    $appeal->save();

    // Custom data saved in database for appeal if user has set any.
    $customData = CRM_Core_BAO_CustomField::postProcess($params, $appeal->id, 'VolunteerAppeal');
    if (!empty($customData)) {
      CRM_Core_BAO_CustomValueTable::store($customData, 'civicrm_volunteer_appeal', $appeal->id);
    }

    return $appeal;
  }

  /**
   * Strips invalid params, throws exception in case of unusable params.
   *
   * @param array $params
   *   Params for self::create().
   * @return array
   *   Filtered params.
   *
   * @throws Exception
   *   Via delegate.
   */
  private static function validateCreateParams(array $params) {
    if (empty($params['id']) && empty($params['title'])) {
      CRM_Core_Error::fatal(ts('Title field is required for Appeal creation.'));
    }
    if (empty($params['id']) && empty($params['appeal_description'])) {
      CRM_Core_Error::fatal(ts('Appeal Description field is required for Appeal creation.'));
    }

    return $params;
  }

  /**
   * Get a list of Project Appeal matching the params.
   *
   * This function is invoked from within the web form layer and also from the
   * API layer. Special params include:
   * 
   *
   * NOTE: This method does not return data related to the special params
   * outlined above; however, these parameters can be used to filter the list
   * of Projects appeal that is returned.
   *
   * @param array $params
   * @return array of CRM_Volunteer_BAO_VolunteerAppeal objects
   */
  public static function retrieve(array $params) {
    $result = array();
  
    $query = CRM_Utils_SQL_Select::from('`civicrm_volunteer_appeal` vp')->select('*');
    $appeal = new CRM_Volunteer_BAO_VolunteerAppeal();

    $appeal->copyValues($params);
    
    foreach ($appeal->fields() as $field) { 
      $fieldName = $field['name'];

      if (!empty($appeal->$fieldName)) {
        if(isset($appeal->$fieldName) && !empty($appeal->$fieldName) && is_array($appeal->$fieldName)) {
          // Key contains comparator value. eg. "Like, Not Like etc"
          $comparator = key($appeal->$fieldName);
        } else {
          $comparator = "=";
        }
        // Use dynamic comparator based on passed parameter.
        $query->where('!column '.$comparator.' @value', array(
          'column' => $fieldName,
          'value' => $appeal->$fieldName,
        ));
      }
    }

    $dao = self::executeQuery($query->toSQL()); 
    while ($dao->fetch()) {
      $fetchedAppeal = new CRM_Volunteer_BAO_VolunteerAppeal();  
      $daoClone = clone $dao; 
      $fetchedAppeal->copyValues($daoClone);  
      if($fetchedAppeal->image == "null" || !$fetchedAppeal->image) {
        $fetchedAppeal->image = "appeal-default-logo-sq.png";
      }
      $result[(int) $dao->id] = $fetchedAppeal;
    }

  
    $dao->free();
   
    return $result;
  }

  /**
   * Wrapper method for retrieve
   *
   * @param mixed $id Int or int-like string representing Appeal ID
   * @return CRM_Volunteer_BAO_VolunteerAppeal
   */
  public static function retrieveByID($id) {
    $id = (int) CRM_Utils_Type::validate($id, 'Integer');
    // Get Appeal with location and location address based on appeal ID.
    $api = civicrm_api3('VolunteerAppeal', 'getsingle', array(
      'id' => $id,
      'api.LocBlock.getsingle' => array(
        'api.Address.getsingle' => array(),
      ),
    ));
    if (empty($api['loc_block_id']) || empty($api['api.LocBlock.getsingle']['address_id'])) {
      $api['location'] = "";
    } else {
      $address = "";
      if ($api['api.LocBlock.getsingle']['api.Address.getsingle']['street_address']) {
        $address .= " ".$api['api.LocBlock.getsingle']['api.Address.getsingle']['street_address'];
      }
      if ($api['api.LocBlock.getsingle']['api.Address.getsingle']['street_address'] && ($api['api.LocBlock.getsingle']['api.Address.getsingle']['city'] || $api['api.LocBlock.getsingle']['api.Address.getsingle']['postal_code'])) {
        $address .= ' <br /> ';
      }
      if ($api['api.LocBlock.getsingle']['api.Address.getsingle']['city']) {
        $address .= " ".$api['api.LocBlock.getsingle']['api.Address.getsingle']['city'];
      }
      if ($api['api.LocBlock.getsingle']['api.Address.getsingle']['city'] && $api['api.LocBlock.getsingle']['api.Address.getsingle']['postal_code']) {
        $address .= ', '.$api['api.LocBlock.getsingle']['api.Address.getsingle']['postal_code'];
      } else if ($api['api.LocBlock.getsingle']['api.Address.getsingle']['postal_code']) {
        $address .= $api['api.LocBlock.getsingle']['api.Address.getsingle']['postal_code'];
      }
      $api['location'] = $address;
    }
    // Get Project Details.
    $api2 = civicrm_api3('VolunteerProject', 'getsingle', array(
      'id' => $api['project_id'],
      'api.LocBlock.getsingle' => array(
        'api.Address.getsingle' => array(),
      ),
      'api.VolunteerProjectContact.get' => array(
        'options' => array('limit' => 0),
        'relationship_type_id' => 'volunteer_beneficiary',
        'api.Contact.get' => array(
          'options' => array('limit' => 0),
        ),
      ),
    ));
    $flexibleNeed = civicrm_api('volunteer_need', 'getvalue', array(
      'is_active' => 1,
      'is_flexible' => 1,
      'project_id' => $api['project_id'],
      'return' => 'id',
      'version' => 3,
    ));
    if (CRM_Utils_Array::value('is_error', $flexibleNeed) == 1) {
      $flexibleNeed = NULL;
    } else {
      $flexibleNeed = (int) $flexibleNeed;
    }
    $project = CRM_Volunteer_BAO_Project::retrieveByID($api['project_id']);
    $openNeeds = $project->open_needs;
    $project = $project->toArray();
    foreach ($openNeeds as $key => $need) {
      $project['available_shifts'][] = $need['display_time'];
    }
    if (empty($api2['loc_block_id']) || empty($api2['api.LocBlock.getsingle']['address_id'])) {
      $api2['location'] = "";
    } else {
      $address = "";
      if ($api2['api.LocBlock.getsingle']['api.Address.getsingle']['street_address']) {
        $address .= " ".$api2['api.LocBlock.getsingle']['api.Address.getsingle']['street_address'];
      }
      if ($api2['api.LocBlock.getsingle']['api.Address.getsingle']['street_address'] && ($api2['api.LocBlock.getsingle']['api.Address.getsingle']['city'] || $api2['api.LocBlock.getsingle']['api.Address.getsingle']['postal_code'])) {
        $address .= ' <br /> ';
      }
      if ($api2['api.LocBlock.getsingle']['api.Address.getsingle']['city']) {
        $address .= " ".$api2['api.LocBlock.getsingle']['api.Address.getsingle']['city'];
      }
      if ($api2['api.LocBlock.getsingle']['api.Address.getsingle']['city'] && $api2['api.LocBlock.getsingle']['api.Address.getsingle']['postal_code']) {
        $address .= ', '.$api2['api.LocBlock.getsingle']['api.Address.getsingle']['postal_code'];
      } else if ($api2['api.LocBlock.getsingle']['api.Address.getsingle']['postal_code']) {
        $address .= $api2['api.LocBlock.getsingle']['api.Address.getsingle']['postal_code'];
      }
      $project['project_location'] = $address;
    }
    foreach ($api2['api.VolunteerProjectContact.get']['values'] as $projectContact) {
      if (!array_key_exists('beneficiaries', $project)) {
        $project['beneficiaries'] = array();
      }
      $project['beneficiaries'][] = array(
        'id' => $projectContact['contact_id'],
        'display_name' => $projectContact['api.Contact.get']['values'][0]['display_name'],
        'image_URL' => $projectContact['api.Contact.get']['values'][0]['image_URL'],
        'email' => $projectContact['api.Contact.get']['values'][0]['email'],
      );
    }
    $api['project'] = $project;
    $api['project']['flexibleNeed'] = $flexibleNeed;

    return $api;
  }


  /**
   * @inheritDoc This override adds a little data massaging prior to calling its
   * parent.
   *
   * @deprecated since version 4.7.21-2.3.0
   *   Internal core methods should not be extended by third-party code.
   */
  public function copyValues(&$params, $serializeArrays = FALSE) {
    if (is_a($params, 'CRM_Core_DAO')) {
      $params = get_object_vars($params);
    }

    if (array_key_exists('is_active', $params)) {
      /*
       * don't force is_active to have a value if none was set, to allow searches
       * where the is_active state of appeal is irrelevant
       */
      $params['is_active'] = CRM_Volunteer_BAO_VolunteerAppeal::isOff($params['is_active']) ? 0 : 1;
    }
    return parent::copyValues($params, $serializeArrays);
  }
  
  /**
   * Invoked from the API layer.
   *
   * Fetch appeal based on search parameter.
   * @param array $params
   * @return array $appeals
   */
  public static function doSearch($params) {
    
    $show_beneficiary_at_front = 1;
    $seperator = CRM_CORE_DAO::VALUE_SEPARATOR;

    $select = " SELECT (select id from civicrm_volunteer_need where civicrm_volunteer_need.is_flexible = 1 and civicrm_volunteer_need.project_id=p.id) as need_flexi_id, appeal.*, addr.street_address, addr.city, addr.postal_code";
    $select .= " , GROUP_CONCAT(DISTINCT need.id ) as need_id";//,mdt.need_start_time
    $from = " FROM civicrm_volunteer_appeal AS appeal";
    $join = " LEFT JOIN civicrm_volunteer_project AS p ON (p.id = appeal.project_id) ";
    $join .= " LEFT JOIN civicrm_loc_block AS loc ON (loc.id = appeal.loc_block_id) ";
    $join .= " LEFT JOIN civicrm_address AS addr ON (addr.id = loc.address_id) ";
    $join .= " LEFT JOIN civicrm_volunteer_need AS need ON (need.project_id = p.id) And need.is_active = 1 And need.is_flexible = 1 And need.visibility_id = 1";
    if($show_beneficiary_at_front == 1) {
      $beneficiary_rel_no = CRM_Core_PseudoConstant::getKey("CRM_Volunteer_BAO_ProjectContact", 'relationship_type_id', 'volunteer_beneficiary');
      $join .= " LEFT JOIN civicrm_volunteer_project_contact AS pc ON (pc.project_id = p.id And pc.relationship_type_id='".$beneficiary_rel_no."') ";
      $join .= " LEFT JOIN civicrm_contact AS cc ON (cc.id = pc.contact_id) ";
      $select .= " , GROUP_CONCAT(DISTINCT cc.display_name ) as beneficiary_display_name";
    }
    // Appeal should be active, Current Date between appeal date and related project should be active.
    $where = " Where p.is_active = 1 And appeal.is_appeal_active = 1 And CURDATE() between appeal.active_fromdate and appeal.active_todate ";

    if(isset($params['search_appeal'])) {
      $search_appeal = $params['search_appeal'];
      $search_appeal = trim($search_appeal);
      $where .= " And (appeal.title Like '%".$search_appeal."%' OR appeal.appeal_description Like '%".$search_appeal."%' OR cc.display_name LIKE '%".$search_appeal."%')";
    }
    //Advance search parameter.
    if(isset($params["advanced_search"])) {
      // If start date and end date filter passed on advance search.
      if($params["advanced_search"]["fromdate"] && $params["advanced_search"]["todate"]) {
        $select .= " , GROUP_CONCAT(DISTINCT advance_need.id ) as need_shift_id";
        $join .= " LEFT JOIN civicrm_volunteer_need as advance_need ON (advance_need.project_id = p.id) And advance_need.is_active = 1 And advance_need.visibility_id = 1 and advance_need.is_flexible=0";

        $start_time = $params["advanced_search"]["fromdate"];
        $end_time = $params["advanced_search"]["todate"];
        $where .= " AND (
          (
            (advance_need.end_time IS NULL AND DATE_FORMAT(advance_need.start_time,'%Y-%m-%d')>='".$start_time."')  OR (DATE_FORMAT(advance_need.start_time,'%Y-%m-%d')>='".$start_time."' and  DATE_FORMAT(advance_need.end_time,'%Y-%m-%d')<='".$end_time."')
          ) 
        )";
      } else { // one but not the other supplied:
        $select .= " , GROUP_CONCAT(DISTINCT advance_need.id ) as need_shift_id";
        $join .= " LEFT JOIN civicrm_volunteer_need as advance_need ON (advance_need.project_id = p.id) And advance_need.is_active = 1 And advance_need.visibility_id = 1 and advance_need.is_flexible=0";
        if($params["advanced_search"]["fromdate"]) {
          $where .= " And (DATE_FORMAT(advance_need.start_time,'%Y-%m-%d')>='".$params["advanced_search"]["fromdate"]."')";
        }
        if($params["advanced_search"]["todate"]) {
          $where .= " And (DATE_FORMAT(advance_need.todate,'%Y-%m-%d')<='".$params["advanced_search"]["todate"]."')";
        }
      }

      // If show appeals done anywhere passed on advance search.
      if(isset($params["advanced_search"]["show_appeals_done_anywhere"]) && $params["advanced_search"]["show_appeals_done_anywhere"] == true ) {
        $where .= " And appeal.location_done_anywhere = 1 ";
      } else {
        // If show appeal is not set then check postal code, radius and proximity.
        if(isset($params["advanced_search"]["proximity"]['postal_code']) || (isset($params["advanced_search"]["proximity"]['lat']) && isset($params["advanced_search"]["proximity"]['lon']))) {
          $proximityquery = CRM_Volunteer_BAO_Project::buildProximityWhere($params["advanced_search"]["proximity"]);
          $proximityquery = str_replace("civicrm_address", "addr", $proximityquery);
          $where .= " And ".$proximityquery;
        }
      }
      // If custom field pass from advance search filter.
      if(isset($params["advanced_search"]["appealCustomFieldData"]) && !empty($params["advanced_search"]["appealCustomFieldData"])) {
        // Get all custom field database tables which are assoicated with Volunteer Appeal.
        $sql_query = "SELECT cg.table_name, cg.id as groupID, cg.is_multiple, cf.column_name, cf.id as fieldID, cf.data_type as fieldDataType FROM   civicrm_custom_group cg, civicrm_custom_field cf WHERE  cf.custom_group_id = cg.id AND    cg.is_active = 1 AND    cf.is_active = 1 AND  cg.extends IN ( 'VolunteerAppeal' )";
        $dao10 = CRM_Core_DAO::executeQuery($sql_query);
        // Join all custom field tables with appeal data which are assoicated with VolunteerAppeal.
        while ($dao10->fetch()) {
          $table_name = $dao10->table_name;
          $column_name = $dao10->column_name;
          $fieldID = $dao10->fieldID;
          $table_alias = "table_".$fieldID;
          // Join all custom field tables.
          $join .= " LEFT JOIN $table_name $table_alias ON appeal.id = $table_alias.entity_id";
          $select .= ", ".$table_alias.".".$column_name;
          foreach ($params["advanced_search"]["appealCustomFieldData"] as $key => $field_data) {
            if(isset($field_data) && !empty($field_data)) {
              $custom_field_array = explode("_", $key);
              if(isset($custom_field_array) && isset($custom_field_array[1])) {
                $custom_field_id = $custom_field_array[1];
                if($custom_field_id == $fieldID) {
                  // If value is in array then implode with Pipe first and then add in where condition.
                  if(is_array($field_data)) {
                    $field_data_string = implode("|", $field_data);
                    $where .= " AND CONCAT(',', $table_alias.$column_name, ',') REGEXP '$seperator($field_data_string)$seperator'";
                  } else {
                    // Otherwise add with like query.
                    $where .= " AND $table_alias.$column_name Like'%$field_data%'";
                  }
                }
              }
            }
          }
        }
      }
    }
    // Order by Logic.
    $orderByColumn = "appeal.id";
    $order = "ASC";
    if(empty($params["orderby"])) {
      $params["orderby"] = "upcoming_appeal";
      $params["order"] = "DESC";
    }
    if(!empty($params["orderby"])) {
      if($params["orderby"] == "project_beneficiary") {
        $orderByColumn = "cc.display_name";
      } elseif($params["orderby"] == "upcoming_appeal") {
        $select .= ", mdt.need_start_time";
        $join .= " LEFT JOIN (SELECT MIN(start_time) as need_start_time, id, project_id as need_project_id FROM civicrm_volunteer_need as need_sort Where id IS NOT NULL GROUP BY project_id) AS mdt ON (mdt.need_project_id = p.id)";      
        $orderByColumn = "mdt.need_start_time";
      } else {
        $orderByColumn = $params["orderby"];
      }
    }
    if(!empty($params["order"])) {
      $order = $params["order"];
    }
    // prepare orderby query.
    $orderby = " GROUP By appeal.id ORDER BY " . $orderByColumn . " " . $order;
    
    // Pagination Logic.
    $no_of_records_per_page = 10;//2;
    if(isset($params['page_no']) && !empty($params['page_no'])) {
      $page_no = $params['page_no'];
    } else {
      $page_no = 1;
    }
    $offset = ($page_no-1) * $no_of_records_per_page;
    $limit = " LIMIT ".$offset.", ".$no_of_records_per_page;
    $sql = $select . $from . $join . $where . $orderby . $limit;
    $dao = new CRM_Core_DAO();
    $dao->query($sql);

    $sql2 = $select . $from . $join . $where . $orderby;
    $dao2 = new CRM_Core_DAO();   
    $dao2->query($sql2);
    $total_appeals = count($dao2->fetchAll());
    $appeals = array();
    $appeals['appeal'] = array();
    $appeal = [];
    // Prepare appeal details array with proper format.
    while ($dao->fetch()) {
      $appeal['id'] = $dao->id;
      $appeal['project_id'] = $dao->project_id;
      $appeal['title'] = $dao->title;
      if($dao->image == "null" || !$dao->image) {
        $dao->image = "appeal-default-logo-sq.png";
      }
      $appeal['image'] = $dao->image;
      $appeal['appeal_teaser'] = $dao->appeal_teaser;
      $appeal['appeal_description'] = htmlspecialchars_decode($dao->appeal_description);
      $appeal['location_done_anywhere'] = $dao->location_done_anywhere;
      $appeal['is_appeal_active'] = $dao->is_appeal_active;
      $appeal['active_fromdate'] = $dao->active_fromdate;
      $appeal['active_todate'] = $dao->active_todate;
      $appeal['display_volunteer_shift'] = $dao->display_volunteer_shift;
      $appeal['hide_appeal_volunteer_button'] = $dao->hide_appeal_volunteer_button;
      $appeal['show_project_information'] = $dao->show_project_information;
      $appeal['beneficiary_display_name'] = $dao->beneficiary_display_name;
      $appeal['need_id'] = $dao->need_id;
      $appeal['need_shift_id'] = $dao->need_shift_id;
      $appeal['need_flexi_id'] = $dao->need_flexi_id;
      if($params["orderby"] == "upcoming_appeal") {
        $appeal['need_start_time'] = $dao->need_start_time;
      }
      // Prepare whole address of appeal in array.
      $address = "";
      if ($dao->street_address) {
        $address .= " ".$dao->street_address;
      }
      if ($dao->street_address && ($dao->city || $dao->postal_code)) {
        $address .= ' <br /> ';
      }
      if ($dao->city) {
        $address .= " ".$dao->city;
      }
      if ($dao->city && $dao->postal_code) {
        $address .= ', '.$dao->postal_code;
      } else if ($dao->postal_code) {
        $address .= $dao->postal_code;
      }
      $appeal['location'] =  $address;
      $appeals['appeal'][] = $appeal;
    }
    $appeals['total_appeal'] = $total_appeals;

    return $appeals;
  }

}