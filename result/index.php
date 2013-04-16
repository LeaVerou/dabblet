<?php

# error_reporting(E_ALL);
# ini_set('display_errors', 1);

preg_match('#\bgist\/([\da-f]+)#i', $_SERVER['REQUEST_URI'], $gist_id);
$gist_id = $gist_id[1];

if($gist_id) {
	preg_match('#\bgist\/[\da-f]+\/([\da-f]+)#i', $_SERVER['REQUEST_URI'], $gist_rev);

	$gist_rev = $gist_rev[1];
	
	$uri = "https://api.github.com/gists/$gist_id";
	
	if($gist_rev) {
		$uri .= "/$gist_rev";
	}
	
	try {
		$raw = file_get_contents($uri);
	} catch(Exception $e) {
		echo $e;
	}
	
	if($raw) {
		if(function_exists('json_decode')) {
			$data = json_decode($raw, true);
		}
	}
}

if(!$data || !$data['files'] || isset($data['message'])) {
	die($data? $data['message'] : 'Not found, sorry! :(');
}

$css = $data['files']['dabblet.css']['content'];
$html = $data['files']['dabblet.html']['content'];
$js = $data['files']['dabblet.js']['content'];
$settings = json_decode($data['files']['settings.json']['content'], true);

if (!$css) {
	foreach ($data['files'] as $filename => $content) {
		if (strpos($filename, '.css') > 0) {
			$css = $content['content'];
			break;
		}
	}
}


if (!$html) {
	foreach ($data['files'] as $filename => $content) {
		if (strpos($filename, '.html') > 0) {
			$html = $content['content'];
			break;
		}
	}
}

if (!$js) {
	foreach ($data['files'] as $filename => $content) {
		if (strpos($filename, '.js') > 0) {
			$js = $content['content'];
			break;
		}
	}
}

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
<script src="http://dabblet.com/code/prefixfree.min.js"></script>
<? endif; ?>
<? if ($js): ?>
<script>
if (parent === window) {
	document.addEventListener('DOMContentLoaded', function() {
		<?= $js ?>
	});
}
</script>
<? endif; ?>
</head>
<body><?= $html ?></body>
</html>