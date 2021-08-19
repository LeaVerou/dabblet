<?php

require 'keys.php';

$code = $_REQUEST['code'];

if($code) {
	$ch = curl_init('https://github.com/login/oauth/access_token');

	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, "client_id=$client_id&client_secret=$client_secret&code=$code");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array(
		'Origin: https://dabblet.com'
	));
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);

	$response = curl_exec($ch);

	curl_close($ch);

	if(preg_match('/access_token=(\\w+)/i', $response, $matches)) {
		$token = $matches[1];
	}
}
?>

<script>
opener.gist.oauth[1]('<?= $token ?>');
close();
</script>