<?php

# error_reporting(E_ALL);
# ini_set('display_errors', 1);

//$gist_id = $_SERVER['REQUEST_URI'];

//$gist_id = substr($gist_id, strrpos($gist_id, '/') + 1);

preg_match('#\bgist\/([\da-f]+)#i', $_SERVER['REQUEST_URI'], $gist_id);
$gist_id = $gist_id[1];

if($gist_id) {
	preg_match('#\bgist\/[\da-f]+\/([\da-f]+)#i', $_SERVER['REQUEST_URI'], $gist_rev);
	$gist_rev = $gist_rev[1];
	
	$uri = "https://api.github.com/gists/$gist_id";
	
	if($gist_rev) {
		$uri .= "/$gist_rev";
	}
	
	$raw = file_get_contents($uri);
	
	if($raw) {
		if(function_exists('json_decode')) {
			$data = json_decode($raw, true);
		}
	}
}

if(!$data || isset($data['message'])) {
	die($data? $data['message'] : 'Not found, sorry! :(');
}

$css = $data['files']['dabblet.css']['content'];
$html = $data['files']['dabblet.html']['content'];
$settings = json_decode($data['files']['settings.json']['content'], true);

//print_r($data)
?><!DOCTYPE html>
<html>
<head>

<meta charset="utf-8" />
<title><?= $data['description'] ?></title>
<style>
<?= strpos($css, '{') === FALSE? 'html{' . $css . '}' : $css ?>
</style>
<? if (
	(!isset($settings['version']) && !isset($settings['prefixfree']))
	|| $settings['prefixfree']
	|| $settings['settings']['prefixfree']
	): ?>
<script src="/code/prefixfree.min.js"></script>
<? endif; ?>
</head>
<body><?= $html ?></body>
</html>