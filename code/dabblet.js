var gist = {
	clientId: 'da931d37076424f332ef',
	
	oauth: [
		// Step 1: Ask permission
		function(callback){
			gist.oauth.callback = callback;
			
			var popup = open('https://github.com/login/oauth/authorize' + 
				'?client_id=' + gist.clientId +
				'&scope=gist', 'popup', 'width=1015,height=500');
		},
		// Step 2: Get access token and store it
		function(token){
			if(token) {
				window.ACCESS_TOKEN = localStorage['access_token'] = token;
				
				gist.getUser(gist.oauth.callback);
				
			}
			else {
				alert('Authentication error');
			}
			
			gist.oauth.callback = null;
		}
	],
	
	request: function(o) {
		o.method = o.method || 'GET';
		o.id = o.id || '';
		o.rev = o.rev || '';
		
		var anon = o.anon || o.method === 'GET';
		
		if(!anon && !ACCESS_TOKEN) {
			gist.oauth[0](function(){
				gist.request(o);
			});
			return;
		}
		
		var path = o.path || 'gists' +
				(o.id? '/' + o.id : '') +
				(o.rev? '/' + o.rev : '') +
				(o.gpath || '');
		
		$u.xhr({
			method: o.method,
			url: 'https://api.github.com/' + path + (!o.anon && ACCESS_TOKEN? '?access_token=' + ACCESS_TOKEN : ''),
			headers: o.headers,
			callback: function(xhr) {				
				var data = JSON.parse(xhr.responseText);
				
				if(data.message) {
					alert('Sorry, I got a ' + xhr.status + ' (' + data.message + ')');
				}
				else {
					o.callback && o.callback(data, xhr);
				}
			},
			data: o.data? JSON.stringify(o.data) : null
		});
	},
	
	getUser: function(callback) {
		gist.request({
			path: 'user',
			callback: function(data) {
				window.user = data;
				
				var login = user.login;
				
				currentuser.innerHTML = gist.getUserHTML(user);
				currentuser.href = gist.getUserURL(user);
				
				window['save-button'].onclick = window['save-cmd'].onclick = gist.save;
				window['save-cmd'].removeAttribute('data-disabled');
				window['save-new-cmd'].removeAttribute('data-disabled');
				
				callback && callback();
			}
		});
	},
	
	getUserHTML: function(user) {
		return '<img src="' + user.avatar_url + '">' + (user.name || user.login);
	},
	
	getUserURL: function(user) {
		return 'https://gist.github.com/' + user.login;
	},
	
	save: function(options){
		options = options || {};
		
		var anonymous = options.anon || !window.user;
		
		if(gist.id 
		&& (!gist.user || !window.user || gist.user.id != user.id)
		&& !anonymous
		) {
			// If it doesn't belong to current user, fork first
			gist.fork(gist.id, gist.save, options.anon);
			return;
		}
		
		var id = gist.id || '',
			cssCode = css.textContent,
			htmlMarkup = html.textContent,
			title = Dabblet.title(cssCode);
			
		gist.request({
			anon: options.anon,
			id: anonymous || options.forceNew? null : id,
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain; charset=UTF-8'
			},
			callback: function(data, xhr) {
				if(data.id) {
					gist.update(data);
				}
			},
			data: {
				"description": title,
				"public": true,
				"files": {
					"dabblet.css": {
						"content": cssCode
					},
					"dabblet.html": htmlMarkup? {
						"content": htmlMarkup
					} : null,
					"settings.json": {
						"content": JSON.stringify(Dabblet.settings.current(null, 'file'))
					}
				}
			}
		});
	},
	
	fork: function(id, callback, anon) {
		gist.request({
			method: 'POST',
			gpath: '/fork',
			id: id || gist.id || null,
			headers: {
				'Content-Type': 'text/plain; charset=UTF-8'
			},
			callback: function(data, xhr) {
				if(data.id) {
					gist.update(data);
					
					callback && callback();
				}
			},
			data: {}	
		});
	},
	
	load: function(id, rev){
		gist.request({
			id: id || gist.id,
			rev: rev || gist.rev,
			callback: function(data){
				gist.update(data);
				
				var files = data.files;
				
				var cssFile = files['dabblet.css'],
					htmlFile = files['dabblet.html'],
					settings = files['settings.json'];

				if(!cssFile || !htmlFile) {
					for(var filename in files) {
						var ext = filename.slice(filename.lastIndexOf('.'));
						
						if(!cssFile && ext == '.css') {
							cssFile = files[filename];
						}

						if(!htmlFile && ext == '.html') {
							htmlFile = files[filename];
						}
						
						if(cssFile && htmlFile) {
							break;
						}
					}
				}
				
				if(htmlFile) {
					html.textContent = htmlFile.content;
					html.onkeyup();
				}
				
				if(cssFile) {
					css.textContent = cssFile.content;
					css.onkeyup();
				}
				
				var defaultSettings = Dabblet.settings.current();
				
				if(typeof localStorage.settings === 'string') {
					defaultSettings = $u.merge(defaultSettings, JSON.parse(localStorage.settings));
				}
				
				if(settings) {
					try { settings = JSON.parse(settings.content); }
					catch(e) { settings = {}; }
				}
				else {
					settings = {};
				}
				
				Dabblet.settings.apply($u.merge(defaultSettings, settings));
			}
		});
	},
	
	update: function(data) {
		var id = data.id,
			rev = data.history && data.history[0].version || '';
		
		if(gist.id != id) {
			gist.id = id;
			gist.rev = undefined;
			
			history.pushState(null, '', '/gist/' + id + location.search + location.hash);
		}
		else if(gist.rev && gist.rev !== rev) {
			gist.rev = rev;

			history.pushState(null, '', '/gist/' + id + '/' + rev + location.search + location.hash);
		}
		
		if(data.user) {
			gist.user = data.user;
		}
		
		var gistUser = window['gist-user'];
		if(gist.user && gist.user != window.user) {
			gistUser.innerHTML = gist.getUserHTML(gist.user);
			gistUser.href = gist.getUserURL(gist.user);
			gistUser.removeAttribute('aria-hidden');
		}
		else {
			gistUser.setAttribute('aria-hidden', 'true');
		}
		
		$$('a[data-href*="{gist-id}"]').forEach(function(a) {
			a.href = a.getAttribute('data-href')
						.replace(/\{gist-id\}/gi, id)
						.replace(/\{gist-rev\}/gi, rev);
			a.removeAttribute('data-disabled');
			a.removeAttribute('aria-hidden');
		});
		
		gist.saved = true;
	},
	
	_saved: true
};

Object.defineProperty(gist, 'saved', {
	get: function() {
		return this._saved;
	},
	
	set: function(saved) {
		saved = !!saved;
		
		if(saved === this._saved) {
			return;
		}
		
		this._saved = saved;
		
		if(saved) {
			document.body.removeAttribute('data-unsaved');
			window['save-cmd'].setAttribute('data-disabled', '');
		}
		else {
			document.body.setAttribute('data-unsaved', '');
			
			if(window.user) {
				window['save-cmd'].removeAttribute('data-disabled');
			}
		}
	}
});

var Dabblet = {
	version: '1.0.6',
	
	pages: {
		css: window['css-page'],
		html: window['html-page'], 
		result: result
	},
	
	title: function(code) {
		return (code && code.match(/^\/\*[\s\*\r\n]+(.+?)($|\*\/)/m) || [,'Untitled'])[1];
	},
	
	wipe: function() {
		var question = 'Are you sure? You will lose ' +
						(gist.saved? '' : 'unsaved changes and ') +
						'your local draft.';
						
		if(confirm(question)) {
			localStorage.removeItem('dabblet.css');
			localStorage.removeItem('dabblet.html');
			window.onbeforeunload = null;
			return true;
		}
		
		return false;
	},
	
	get popup() {
		return popup.src;
	},
	
	set popup(url) {
		if(url) {
			popup.src = url;
			popup.parentNode.style.display = 'block';
		}
		else {
			popup.src = '';
			popup.parentNode.style.display = '';
		}
	},
	
	update: {
		CSS: function(code) {
			if(!result.contentWindow.style) {
				return;
			}
			
			var style = result.contentWindow.style;
			
			if(style) {
				code = code || css.textContent;
				
				var title = Dabblet.title(code),
					raw = code.indexOf('{') > -1;
			
				result.contentWindow.document.title = title + ' ✿ Dabblet result';
				
				if(!raw) {
					code = 'html{' + code + '}';
				}
				
				var prefixfree = !!Dabblet.settings.cached.prefixfree;
				
				style.textContent = prefixfree? StyleFix.fix(code, raw) : code;
			}
		},
		
		HTML: function(code) {
			if(result.contentDocument.body) {
				result.contentDocument.body.innerHTML = code;
			}
		}
	},
	
	settings: {
		cached: {},
		
		handlers: {
			page: function(page) {
				var currentid = document.body.getAttribute('data-page'),
					current = window[currentid],
					input = window['page-' + page],
					pre = window[page] || css;
		
				if(currentid == page) {
					return;
				} 
					
				if(current) {
					var ss = current.selectionStart,
						se = current.selectionEnd;
					
					ss && current.setAttribute('data-ss', ss);
					se && current.setAttribute('data-se', se);
				}
		
				if(input && input.value != page || input.checked === false) {
					input.click();
				}

				document.body.setAttribute('data-page', page);
				
				self.Previewer && Previewer.hideAll();
				
				pre.focus && pre.focus();
				
				var ss = pre.getAttribute('data-ss'),
					se = pre.getAttribute('data-se');
					
				if((ss || se) && pre.setSelectionRange) {
					setTimeout(function(){
						pre.setSelectionRange(ss, se);
					}, 2);
				}
			},
			
			prefixfree: function(enabled) {
				Dabblet.settings.cached.prefixfree = enabled;
				
				if(result.contentWindow.style) {
					Dabblet.update.CSS();
				}
			}
		},
		
		current: function(name, scope) {
			var settings = {};
			
			var selector = 'input[data-scope' +
							(scope? '="' + scope + '"' : '') + ']' +
							(name? '[name="' + name + '"]' : '');
			
			$$(selector).forEach(function(input){
				if(!(input.name in settings)) {
					// Assign default value
					if('checked' in input) {
						settings[input.name] = input.hasAttribute('checked')? input.value : '';
					}
				}
				
				if(!('checked' in input) || input.checked) {
					settings[input.name] = input.value; 
				}
				else if(input.type === 'checkbox') {
					settings[input.name] = ''; 
				}
			});
			
			return name? settings[name] : settings;
		},
		
		apply: function() {
			var settings;
			
			if(arguments.length === 0) {
				settings = this.current();
			}
			else if(arguments.length === 1) {
				settings = arguments[0];
			}
			else {
				settings = {};
				settings[arguments[0]] = arguments[1];
			}
			
			for(var name in settings) {
				this.applyOne(name, settings[name]);
			}
			
			// Set body classes for each setting
			$$('input[data-scope]').forEach(function(input){
				var name = input.name;
				
				(input.onclick = function(evt){
					switch(this.type) {
						case 'radio':
							if(this.checked) {
								Dabblet.settings.applyOne(name, this.value);
							}
							return;
						case 'checkbox':
							Dabblet.settings.applyOne(name, this.checked? this.value : '');
							return;
						default:
							Dabblet.settings.applyOne(name, this.value);
							return;
					}
				}).call(input);
			});
			
			// Update cached settings
			this.cached = this.current();
		},
		
		applyOne: function(name, value) {			
			var current = this.current(name),
				controls = document.getElementsByName(name);

			for(var i=0; i<controls.length; i++) {
				var control = controls[i];
				
				control.checked = control.value == value;
			}
			
			if(name in this.handlers) {
				this.handlers[name](value);
			}
			else {
				var attribute = 'data-' + name;
				
				if(value === '') {
					document.body.removeAttribute(attribute);
				}
				else {
					document.body.setAttribute(attribute, value);
				}
			}
			
			// Super-dirty fix for Safari bug. See issue #7. Gonna wash hands now, kthxbai
			if(PrefixFree.Prefix === 'Webkit') {
				document.body.style.WebkitAnimation = 'bugfix infinite 1s';
				setTimeout(function(){
					document.body.style.WebkitAnimation = '';
				},1);
			}
			
			// Update localStorage if not in gist
			if(!gist.id) {
				var stored = localStorage.settings? JSON.parse(localStorage.settings) : {};
				
				if(!(name in stored) || stored[name] != value) {
					stored[name] = value;
					localStorage.settings = JSON.stringify(stored);
				}
			}
			
			// Update cached settings
			this.cached[name] = value;
		}
	}
};

window.ACCESS_TOKEN = localStorage['access_token'];

currentuser.onclick = function(){
	if(!this.hasAttribute('href')) {
		gist.oauth[0]();
	}
}

window.onbeforeunload = function(){
	if(!gist.saved) {
		html.onkeyup();
		css.onkeyup();
		
		css.onblur();
		html.onblur();
		
		//return 'You have unsaved changes.';
	}
};

result.onload = function(){
	if(!result.loaded 
		&& !result.contentWindow.document.body) {
		setTimeout(arguments.callee, 100);
		return;
	}
	
	result.loaded = true;
	
	if(!result.contentDocument) {
		result.contentDocument = result.contentWindow.document;
	}
	
	result.contentWindow.style = $('style', result.contentDocument);
	
	result.contentDocument.onkeydown = document.onkeydown;
	
	html.onkeyup();
	css.onkeyup();
};

// Fix Chrome bug
setTimeout(function(){
	if(!result.loaded) {
		result.onload();
	}
}, 500);

document.addEventListener('DOMContentLoaded', function() {
	if(ACCESS_TOKEN) {
		gist.getUser();
	}
	
	var a = $('h1 > a');
	
	if(parent !== window) {
		document.body.setAttribute('data-embedded', '')
		
		a.href = '';
		a.target = '_blank';
		a.title = 'Go to full page dabblet';
	}
	else {
		a.onclick = Dabblet.wipe;
		a.title = 'New dabblet';
	}
	
	var path = location.pathname.slice(1);
	
	if(path) {
		// Viewing a gist?
		if(gist.id = (path.match(/\bgist\/([\da-f]+)/i) || [])[1]) {
			gist.rev = (path.match(/\bgist\/[\da-f]+\/([\da-f]+)/i) || [])[1];
			css.textContent = html.textContent = '';
			gist.load();
		}
	}
	
	if(!gist.id) {	
		if(typeof localStorage['dabblet.css'] === 'string') {
			css.textContent = localStorage['dabblet.css'];
		}
		
		if(typeof localStorage['dabblet.html'] === 'string') {
			html.textContent = localStorage['dabblet.html'];
		}
		
		if(typeof localStorage.settings === 'string') {
			Dabblet.settings.apply(JSON.parse(localStorage.settings));
		}
		else {
			Dabblet.settings.apply();
		}
	}
});

$$('.editor.page > pre').forEach(function(pre){
	new Editor(pre);
	
	$u.event.bind(pre.parentNode, 'click', function(evt) {
		$('pre', this).focus();
		
		evt.stopPropagation();
	});
});

// Note: Has to be keydown to be able to cancel the event
document.onkeydown = function(evt) {
	var code = evt.keyCode,
		character = String.fromCharCode(code),
		cmdOrCtrl = evt.metaKey || evt.ctrlKey;
	
	if(cmdOrCtrl && !evt.altKey) {
		switch(character) {
			case 'S':
				gist.save();
				return false;
			case 'N':
				if(Dabblet.wipe()) {
					location.pathname = '/';	
				}
				return false;
			case '1':
				var page = 'css';
				break;
			case '2':
				var page = 'html';
				break;
			case '3':
				var page = 'all';
				break;
			case '4':
				var page = 'result';
				break;
		}
		
		var currentPage = Dabblet.settings.current('page');
		
		if(evt.shiftKey) {
			if(code === 219) {
				// Go to previous tab
				var page = ({
					'html': 'css',
					'all': 'html',
					'result': 'all'
				})[currentPage];
			}
			else if (character === ']' || code === 221) {
				// Go to next tab
				var page = ({
					'css': 'html',
					'html': 'all',
					'all': 'result'
				})[currentPage];
			}
		}
		
		if(page) {
			if(currentPage !== page) {
				Dabblet.settings.apply('page', page);
				
				evt.stopPropagation();
				return false;
			}
		}
	}
	
	if(code == 27) { // Esc 
		var active = document.activeElement;
		
		if (active && active != document.body && active.blur) { 
			active.blur();
			return false;
		}
		else if (location.hash) {
			location.hash = '';
		}
	}
	
	if(code == 112) { // F1 
		location.hash = '#help';
		return false;
	}
};

// If only :focus and :checked bubbled...
(function() {
	function ancestorClass(action, className, element) {
		var ancestor = element;
		
		do {
			ancestor = ancestor.parentNode;
			ancestor.classList[action](className)
		} while(ancestor && ancestor != document.body);
	}
	
	$u.event.bind('header a, header input, header button, header [tabindex="0"], pre', {
		focus: function(){
			ancestorClass('add', 'focus', this);
		},
		
		blur: function() {
			ancestorClass('remove', 'focus', this);
		}
	});
})();