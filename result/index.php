<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

$gist_id = $_SERVER['REQUEST_URI'];

$gist_id = substr($gist_id, strrpos($gist_id, '/') + 1);

if(is_numeric($gist_id)) {
	$raw = file_get_contents("https://api.github.com/gists/$gist_id");
	
	if($raw) {
		if(function_exists('json_decode')) {
			$data = json_decode($raw, true);
		}
	}
}

if(!$data || isset($data['message'])) {
	die($data? $data['message'] : 'Not found, sorry! :(');
}

$settings = json_decode($data['files']['settings.json']['content'], true)

//print_r($data)
?><!DOCTYPE html>
<html>
<head>

<meta charset="utf-8" />
<title><?= $data['description'] ?></title>
<style>
<?= $data['files']['dabblet.css']['content'] ?>
</style>
<? if (!isset($settings['prefixfree']) || $settings['prefixfree']): ?>
<script src="/code/prefixfree.min.js"></script>
<? endif; ?>
</head>
<body><?= $data['files']['dabblet.html']['content'] ?></body>
</html>