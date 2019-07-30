CREATE TABLE IF NOT EXISTS `civicrm_volunteer_appeal` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Unique Volunteer Appeal ID',
  `project_id` int(11) UNSIGNED NOT NULL COMMENT 'Foreign key to the Volunteer Project for this record',
  `title` varchar(255) CHARACTER SET latin1 NOT NULL COMMENT 'The title of the Volunteer Appeal',
  `image` varchar(255) CHARACTER SET latin1 DEFAULT NULL COMMENT 'The Image of the Volunteer Appeal.',
  `appeal_teaser` text CHARACTER SET latin1 COMMENT 'Appeal Teaser',
  `appeal_description` text COLLATE utf8_unicode_ci NOT NULL COMMENT 'Full description of the Volunteer Appeal. Text and HTML allowed.',
  `loc_block_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'FK to Location Block ID',
  `location_done_anywhere` int(1) NOT NULL COMMENT 'Location Done Anywhere "1" Means Location Done Anywhere True and "0" Means not true.',
  `is_appeal_active` int(1) NOT NULL COMMENT 'Volunteer Appeal is Active or not. "1" Means "Active" and "0" Means Not Active.',
  `show_project_information` INT(1) NULL DEFAULT NULL COMMENT 'Should Project information be shown on Appeals',
  `active_fromdate` date DEFAULT NULL COMMENT 'Active From Date of Appeal',
  `active_todate` date DEFAULT NULL COMMENT 'Active To Date of Appeal',
  `display_volunteer_shift` int(1) NOT NULL COMMENT 'Display Volunteer Shift or not.',
  `hide_appeal_volunteer_button` int(1) NOT NULL COMMENT 'Hide Volunteer Appeal Button or not. "1" means Hide and "0" means Not Hide.',
  PRIMARY KEY (`id`),
  KEY `FK_civicrm_volunteer_project_loc_block_id` (`loc_block_id`),
  CONSTRAINT `FK_civicrm_volunteer_appeal_project_id`
    FOREIGN KEY (`project_id`)
    REFERENCES `civicrm_volunteer_project`(`id`)
    ON DELETE CASCADE,
  CONSTRAINT `FK_civicrm_volunteer_appeal_loc_block_id`
    FOREIGN KEY (`loc_block_id`)
    REFERENCES `civicrm_loc_block`(`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=1;
