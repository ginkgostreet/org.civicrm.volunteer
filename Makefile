
push:
	gsync -ruvz ./ lce:/var/www/sandbox-volunteer.leadercenter.org/htdocs/sites/default/files/civicrm/ext/org.civicrm.volunteer/

push-utils:
	gsync -ruvz ./create-custom-fields.php lce:/var/www/sandbox-volunteer.leadercenter.org/htdocs/
	gsync -ruvz ./volunteer_appeal_seed.php lce:/var/www/sandbox-volunteer.leadercenter.org/htdocs/
