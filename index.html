<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="utf-8" />
<title>dabblet.com</title>
<meta name="author" content="Lea Verou" />
<meta name="description" content="An interactive CSS playground and code sharing tool. Dabblet saves to Github gists and offers many conveniences for CSS editing." />
<meta name="viewport" content="width=device-width, initial-scale=1" />

<link rel="stylesheet" href="/style/global.css" />
<link rel="stylesheet" href="/style/style.css" />
<script src="/code/prefixfree.min.js"></script>

<script>window._gaq = [['_setAccount', 'UA-27750908-1'], ['_trackPageview']];</script>
<script src="http://www.google-analytics.com/ga.js" async></script>

</head>
<body>

<header>
	<h1><a href="/">dabblet</a></h1>
	
	<div class="with-inactive-dropdown">
		<a id="currentuser" target="_blank" class="user button">Log in</a>
		<menu class="dropdown">
			<a href="/user/" target="_blank" class="command my-profile">My profile</a>
			<a href="/" onclick="Dabblet.user.logout()" class="command">Log out</a>
		</menu>
	</div>
	
	<div class="with-dropdown">
		<button class="with-symbol" title="Settings">⚙</button>
		<form id="settings" class="dropdown">
			<fieldset id="view">
				<legend>View settings</legend>
				
				<div class="segmented-control">
					<input type="radio" name="view" value="split" id="view-split" checked data-scope="file" />
					<label for="view-split" class="button" title="Horizontal split">Horizontal</label>
					
					<input type="radio" name="view" value="split-vertical" id="view-split-vertical" data-scope="file" />
					<label for="view-split-vertical" class="button" title="Vertical split">Vertical</label>
					
					<input type="radio" name="view" value="separate" id="view-separate" data-scope="file" />
					<label for="view-separate" class="button" title="Separate">Separate</label>
				</div>
				
				<label class="font-size slider" title="Font size">
					<span title="Smaller">A</span>
					<input type="range" name="fontsize" min="50" max="200" value="100" step="10" data-scope="file" />
					<span title="Larger">A</span>
				</label>
				
				<label class="checkbox">
					<input type="checkbox" name="seethrough" value="1" data-scope="file" />
					See-through code
				</label>
			</fieldset>
			
			<fieldset>
				<legend>Libraries</legend>
				<label class="checkbox">
					<input type="checkbox" name="prefixfree" value="1" data-scope="file" checked />
					Use -prefix-free
				</label>
			</fieldset>
		</form>
	</div>
	
	<div class="with-dropdown" id="cloud">
		<button id="save-button" class="with-symbol" title="Save">☁</button>
		<menu class="dropdown">
			<a href="/" onclick="Dabblet.wipe()" class="command" data-keyboard="⌘N">New dabblet</a>
						
			<hr />
			
			<a id="save-cmd" tabindex="0" class="command" data-keyboard="⌘S" data-disabled>Save</a>
			<a onclick="gist.save({forceNew: true})" id="save-new-cmd" class="command" tabindex="0" data-disabled>Save as new</a>
			<a onclick="gist.save({anon: true})" class="command" tabindex="0">Save anonymously</a>
			
			<hr />
			
			<a data-href="https://gist.github.com/{gist-id}/{gist-rev}" target="_blank" class="command" data-disabled>View gist</a>
			<a data-href="http://result.dabblet.com/gist/{gist-id}/{gist-rev}" class="command" target="_blank" aria-hidden="true">View full page result</a>
			<a class="user command" target="_blank" aria-hidden="true" id="gist-user"></a>
		</menu>
	</div>
	
	<div class="controls-group">
		<a href="/help/index.html" class="button" title="Help &amp; credits" target="_blank">?</a>
		<div class="tabs">
			<input type="radio" name="page" value="css" id="page-css" data-scope="file" />
			<label for="page-css" title="⌘1" class="tab">
				<span class="title">CSS 
					<span class="if-not-separate"><i class="amp">&amp;</i> Result</span>
				</span>
			</label>
			
			<input type="radio" name="page" value="html" id="page-html" data-scope="file" />
			<label for="page-html" title="⌘2" class="tab">
				<span class="title">HTML 
					<span class="if-not-separate"><i class="amp">&amp;</i> Result</span>
				</span>
			</label>
			
			<input type="radio" name="page" value="all" id="page-all" checked data-scope="file" />
			<label for="page-all" title="⌘3" class="tab">
				<span class="title">All</span>
			</label>
			
			<input type="radio" name="page" value="javascript" id="page-javascript" data-scope="file" />
			<label for="page-javascript" title="⌘4" class="tab">
				<span class="title">JS<sub style="font-size: 50%; opacity: .6;">alpha</sub></span>
			</label>
			
			<input type="radio" name="page" value="result" id="page-result" data-scope="file" />
			<label for="page-result" title="⌘5" class="tab">
				<span class="title">Result</span>
			</label>
		</div>
	</div>
</header>

<iframe class="page" id="result" src="http://preview.dabblet.com"></iframe>
<section id="css-container" class="editor page"><pre id="css" spellcheck="false" class="language-css" contenteditable>/**
 * The first commented line is your dabblet’s title
 */

background: #f06;
background: linear-gradient(45deg, #f06, yellow);
min-height: 100%;</pre></section>
<button title="Validate CSS" onclick="Dabblet.validate.CSS()" class="for-code css">✓</button>

<section id="html-container" class="editor page"><pre id="html" spellcheck="false" class="language-html" contenteditable>&lt;!-- content to be placed inside &lt;body>…&lt;/body> --></pre></section>
<button title="Validate HTML" onclick="Dabblet.validate.HTML()" class="for-code html">✓</button>

<section id="javascript-container" class="editor page"><pre id="javascript" spellcheck="false" class="language-javascript" contenteditable>// alert('Hello world!');</pre></section>
<button title="Run JavaScript (⌘↩)" onclick="Dabblet.update.JavaScript()" class="for-code javascript">▶</button>

<div id="color" class="previewer"></div>
<div id="abslength" class="previewer"></div>
<div id="time" class="previewer">
	<svg>
		<circle cx="32" cy="32" r="15.9">
			<animate attributeName="stroke-dasharray" values="0,500;100,500;0,500" dur="5s" repeatCount="indefinite" />
			<animate attributeName="stroke-dashoffset" values="0;0;-100" dur="5s" repeatCount="indefinite" />
		</circle>
	</svg>
</div>
<div id="angle" class="previewer">
	<svg>
		<circle cx="32" cy="32" r="15.9" stroke-dasharray="0,500" />
	</svg>
</div>
<div id="fontfamily" class="previewer">(ABCabc123&amp;@%)
(ABCabc123&amp;@%)</div>
<div id="gradient" class="previewer"><div></div></div>
<div id="easing" class="previewer">
	<svg width="100" height="100" viewBox="-20 -20 140 140">
		<defs>
			<marker id="marker" viewBox="0 0 4 4" refX="2" refY="2" markerUnits="strokeWidth">
				<circle cx="2" cy="2" r="1.5" />
			</marker>
		</defs>
		<path d="M0,100 C20,50, 40,30, 100,0" />
		<line x1="0" y1="100" x2="20" y2="50" />
		<line x1="100" y1="0" x2="40" y2="30" />
	</svg>
</div>
<div id="url" class="previewer"><img src="data:," alt="Loading…" /></div>
<div id="entity" class="previewer"></div>

<script src="/code/utopia.js"></script>
<script src="/code/selection.js"></script>
<script src="/code/prism.js"></script>
<script src="/code/code-highlight.js"></script>

<script src="/code/editor.js"></script>
<!--[if lte IE 9]><script src="/code/classList.min.js"></script><![endif]-->
<script src="/code/global.js"></script>
<script src="/code/dabblet.js"></script>

<script src="/code/previewers.js" async defer></script>

</body>
</html>