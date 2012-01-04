var gist = {
	clientId: 'da931d37076424f332ef',
	clientId: '317b97e9fc304529d454',
	
	oauth: [
		// Step 1: Ask permission
		function(callback){
			gist.oauth.callback = callback;
			
			window.open('https://github.com/login/oauth/authorize' + 
				'?client_id=' + gist.clientId +
				'&scope=gist', 'clunkypopup', 'width=1015,height=500');
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
		
		var anon = o.anon || o.method === 'GET';
		
		if(!anon && !ACCESS_TOKEN) {
			gist.oauth[0](function(){
				gist.request(o);
			});
			return;
		}
		
		var path = o.path || 'gists' +
				(o.id? '/' + o.id : '') +
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
						"content": JSON.stringify(Dabblet.state.serialize())
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
	
	load: function(id){
		gist.request({
			id: id || gist.id,
			callback: function(data){
				gist.update(data);
				
				var files = data.files;
				
				var cssFile = files['dabblet.css'],
					htmlFile = files['dabblet.html'],
					state = files['settings.json'];

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
				
				if(state) {
					try { state = JSON.parse(state.content); }
					catch(e) { return; }
					
					state = state.version? state : Dabblet.state.legacy(state);
					
					Dabblet.state.restore(state);
				}
			}
		});
	},
	
	update: function(data) {
		var id = data.id;

		if(gist.id != id) {
			gist.id = id;
			history.pushState(null, '', '/gist/' + id + location.search + location.hash);
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
			a.href = a.getAttribute('data-href').replace(/\{gist-id\}/gi, id);
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
	version: '1.1',
	
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
						'your saved draft.';
						
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
							if(this.checked || evt) {
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
				document.body.setAttribute('data-' + name, value);
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
				// Take care of legacy first
				if(!localStorage.state && localStorage.settings) {
					var state = Dabblet.state.legacy(JSON.parse(localStorage.settings));
					
					localStorage.state = JSON.stringify(state);
					
					localStorage.removeItem('settings');
				}
				
				var state = localStorage.state? JSON.parse(localStorage.state) : {}
					stored = state.settings || {};
				
				if(!(name in stored) || stored[name] != value) {
					stored[name] = value;
					state.settings = stored;
					localStorage.state = JSON.stringify(state);
				}
			}
			
			// Update cached settings
			this.cached[name] = value;
		}
	}
};

Dabblet.view = {
	container: $('.tabs'),
	
	titles: {c: 'CSS', h: 'HTML', r: 'Result'},
	
	presets: {
		"split": [{
			template: 'r\nc'
		}, {
			template: 'r\nh'
		}, {
			template: 'r'
		}],
		"split-vertical": [{
			template: 'cr'
		}, {
			template: 'hr'
		}, {
			template: 'r'
		}],
		"separate": [{
			template: 'c'
		}, {
			template: 'h'
		}, {
			template: 'r'
		}],
		"behind": [{
			template: 'c',
			seethrough: true
		}, {
			template: 'h',
			seethrough: true
		}, {
			template: 'r'
		}]
	},
	
	current: [],
	
	get editing() {
		return !!this._editing;
	},
	
	set editing(value) {
		this._editing = !!value;
		
		document.body.classList[value? 'add' : 'remove']('tabediting');
	},
	
	title: function(template) {
		var title = "",
		    titles = this.titles,
		    panes = 0;
		    
		for (var letter in titles) {
			if (template.indexOf(letter) > -1) {
				title += (title? ' & ' : '') + titles[letter];
				panes++;
			}
		}
		
		if(panes === 3) {
			return 'All';
		}
		
		return title;
	},
	
	goto: function(index, force) {
		var input;

		if(index.nodeType == 1) {
			var input = index;
			index = this.tabIndex(input);
		}
		else {
			var input = this.tabs[index - 1];
		}

		if(!input
		   || index < 1 
		   || index > this.tabs.length
		   || (input === this.tab && !force)
		  ) {
			return false;
		}
		
		input.checked = true;
		
		$$('label.checked', this.container).forEach(function(label) {
			label.className = '';
		});
		
		var label = input.parentNode;
		label.className = 'checked';
		
		Dabblet.view.tab = input;

		var info = Dabblet.view.applyTemplate(input.value);
		
		Dabblet.view.applySeethrough(input.hasAttribute('data-seethrough'));
		
		var cs = (info.template.match(/c/gi) || []).length,
			hs = (info.template.match(/h/gi) || []).length;
			
		if(cs + hs > 0) {
			(hs > cs? html : css).focus();
		}
		
		// Store in localStorage
		Dabblet.state.store();
		
		return true;
	},
	
	next: function(wrap) {
		var tab = this.tabIndex() + 1,
			inRange = this.goto(tab);
		
		if(!inRange && wrap) {
			this.goto(1);
		}
		
		return inRange || wrap;
	},
	
	previous: function(wrap) {
		var tab = this.tabIndex() - 1,
		    inRange = this.goto(tab);
		    
	    if(!inRange && wrap) {
	    	this.goto(this.tabs.length);
	    }
	    
	    return inRange || wrap;
	},
	
	tabIndex: function(input) {
		input = input || this.tab;
		
		return input? +input.getAttribute('data-index') : 1;
	},
	
	deleteTab: function(index) {
		index = index || this.tabIndex();
		
		var input = this.tabs[index - 1],
		    label = input.parentNode,
			title = $('.title', label);
			
		title.style.maxWidth = '0';
		
		setTimeout(function(){
			Dabblet.view.container.removeChild(label);
			
			$u.event.fire(Dabblet.view.container, 'tabcountchange');
			
			window['layout-settings'].style.display = 'none';
			
			if(label.classList.contains('checked')) {
				Dabblet.view.next(true);
			}
		}, 1000);
	},
	
	addTab: function() {
		var index = this.tabIndex(),
			tab = this.tab || this.tabs[this.tabs.length - 1],
			nextTab = this.tabs[index];
		
		var label = this.makeTab(this.serializeTab(tab)),
			title = $('.title', label);
		
		
		this.container.insertBefore(label, nextTab? nextTab.parentNode : null);
		
		title.style.maxWidth = '0';
		setTimeout(function() { title.style.maxWidth = '20em' }, 5);
		
		$u.event.fire(this.container, 'tabcountchange');
		
		this.goto($('input', label), true);
	},
	
	makeTab: function (obj, i) {
		var template = obj.template,
		    title = obj.title || this.title(template),
		    active = !!obj.active,
		    seethrough = !!obj.seethrough;

		var label = $u.element.create({
			tag: 'label',
			properties: {
				title: i < 8? '⌘' + i : '',
				className: active? 'checked' : ''
			}
		});
			
		var input = $u.element.create({
			tag: 'input',
			properties: {
				type: 'radio',
				name: 'tab',
				value: template,
				checked: active
			},
			attributes: {
				'data-index': i
			},
			inside: label
		});
				
		if(seethrough) {
			input.setAttribute('data-seethrough', '');
		}
		
		var title = $u.element.create({
			tag: 'span',
			prop: {
				className: 'title',
				innerHTML: title.replace(/&/g, '<i class=amp>&amp;</i>')
			},
			inside: label
		});
		
		title.style.maxWidth = '20em';
		
		$u.element.create({
			tag: 'button',
			prop: {
				className: 'close',
				title: 'Delete tab',
				onclick: function(evt) {
					var input = $('input', this.parentNode),
						index = +input.getAttribute('data-index');
					
					Dabblet.view.deleteTab(index);
					
					evt.stopPropagation();
				}
			},
			contents: '✖',
			inside: label
		});
		
		if(active) {
			this.tab = input;
		}
		
		return label;
	},
	
	applySeethrough: function(seethrough) {
		var wutAttribute = (seethrough? 'set' : 'remove') + 'Attribute';
		
		document.body[wutAttribute]('data-seethrough', '');
		this.tab && this.tab[wutAttribute]('data-seethrough', '');
	},
	
	applyTemplate: function(code) {
		code = code.toLowerCase().trimRight();
		
		// Find title
		var valid = !!code;
		
		// Find max cols
		var rows = code.split(/\r?\n|\r/g),
			maxCols = 0,
			d = {};
			
		d.c = d.h = d.r = null;
		
		for(var i=0; i<rows.length; i++) {
			maxCols = Math.max(rows[i].length, maxCols);
		}
		
		var dimension = Math.max(rows.length, maxCols);
		
		// Adjust font-size
		layout.style.fontSize = (dimension > 9? 10 : 90/dimension) + 'px';
		layout.style.overflow = dimension > 9? 'auto' : '';
		
		// Pad shorter cols
		for(var i=-1, cols; cols = rows[++i];) {
			if(cols.length < maxCols) {
				var last = cols[cols.length - 1],
					difference = maxCols - cols.length;
				
				rows[i] = cols + Array(difference + 1).join(last);	
			}
		}
		
		layout.firstChild.nodeValue = rows.join('\r\n');
		
		// Convert to layout
		for(letter in d) {
			var dl = d[letter] = d[letter] || {};
			dl.top = dl.left = dl.width = dl.height = null;
		}
		
		outer: for(var i=-1, cols; cols = rows[++i];) {
			for(var letter in d) {
				var dl = d[letter],
					index = cols.indexOf(letter);
				
				if(index > -1) {
					var matches = cols.match(RegExp(letter + '+', 'gi'));
					
					if(matches.length > 1) {
						valid = false;
						break outer;
					}
					
					var count = matches[0].length;
					
					if(!dl.width) {
						dl.width = count;
					}
					
					dl.top = dl.top || 0;
					dl.height = (dl.height || 0) + 1;
					
					if(dl.top + dl.height < i+1) {
						valid = false;
						break outer;
					}
					
					if(dl.left === null) {
						dl.left = index;
					}
					else if(index != dl.left) {
						valid = false;
						break outer;
					}
				}
				else if(!dl.height && !dl.width) {
					dl.top++;
				}
			}
		}
		
		// Check if valid
		if(valid) {
			var area = 0;
			
			for(letter in d) {
				var dl = d[letter];
				area += dl.width * dl.height;
			}
			
			valid = area === rows.length * maxCols;
		}
		
		template.className = valid? '' : 'invalid';
		
		if(valid) {
			var incrementX = 100 / maxCols,
			    incrementY = 100 / rows.length;
			
			for(letter in d) {
				var dl = d[letter],
					id = this.titles[letter].toLowerCase(),
				    style = Dabblet.pages[id].style;
					
				style.top = dl.top * incrementY + '%';
				style.height = dl.height * incrementY + '%';
				style.left = dl.left * incrementX + '%';
				style.width = dl.width * incrementX + '%';
			
				style.display = !dl.height || !dl.width? 'none' : '';
			}
		}
		
		return {
			valid: valid,
			dimensions: d,
			code: code,
			template: rows.join('\r\n')
		};
	},
	
	// Serialize the tab setup into an array of objects
	serialize: function() {
		var arr = [], tabs = Dabblet.view.tabs;
		
		for(var i=0; i<tabs.length; i++) {
			arr.push(this.serializeTab(tabs[i]));
		}
		
		return arr;
	},
	
	serializeTab: function(tab) {
		return {
			//title: tab.nextSibling.textContent,
			template: tab.value,
			active: tab.checked,
			seethrough: tab.hasAttribute('data-seethrough')
		};
	},
	
	// Restore the tabs from an array of objects
	restore: function(arr) {
		var container = Dabblet.view.container;
		
		var fragment = document.createDocumentFragment();
		
		if(!(arr instanceof Array)) {
			arr = Dabblet.view.presets[arr];
		}
		
		var prevIndex = this.tabIndex();
		this.tab = null;
		
		arr.forEach(function(obj, i) {
			fragment.appendChild(this.makeTab(obj, i+1))
		}, this);
		
		container.innerHTML = '';
		container.appendChild(fragment);

		this.goto(this.tab || Math.min(prevIndex, this.tabs.length), true);
	}
};

Dabblet.view.tabs = Dabblet.view.container.getElementsByTagName('input'); // auto-updating

$$('button[name="view"]').forEach(function(button) {
	button.onclick = function() {
		Dabblet.view.restore(this.value);
	};
});

Dabblet.state = {
	serialize: function() {
		var state = {
			version: Dabblet.version,
			settings: Dabblet.settings.current(),
			view: Dabblet.view.serialize()
		};
					
		return state;
	},
	
	restore: function(state) {
		if(state.view && state.view.length) {
			Dabblet.view.restore(state.view);
		}
		else if(!state.version) {
			// Handle legacy stored views
			state = Dabblet.state.legacy(state);
		}
		
		if(state.settings) {
			Dabblet.settings.apply(state.settings);
		}
	},
	
	store: function() {
		localStorage.state = JSON.stringify(this.serialize());
	},
	
	// Construct a state obj via a legacy settings obj
	legacy: function(settings) {
		var view = Dabblet.view.presets[settings.view] || Dabblet.view.presets.split;
		delete settings.view;
		
		if(settings.page) {
			var indices = { 'css': 0, 'html': 1, 'result': 2 },
				index = indices[settings.view] || 0;
			
			view[index].active = true;
			delete settings.page;
		}
		
		return {
			version: Dabblet.version,
			view: view,
			settings: settings
		};
	},
	
	default: {
		version: Dabblet.version,
		view: Dabblet.view.presets.split,
		settings: Dabblet.settings.current()
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
		if(gist.id = (path.match(/\bgist\/(\d+)/i) || [])[1]) {
			css.textContent = html.textContent = '';
			gist.load();
		}
	}
	
	var state = Dabblet.state.default;
	
	if(!gist.id) {	
		if(typeof localStorage['dabblet.css'] === 'string') {
			css.textContent = localStorage['dabblet.css'];
		}
		
		if(typeof localStorage['dabblet.html'] === 'string') {
			html.textContent = localStorage['dabblet.html'];
		}
		
		if(localStorage.state) {
			state = $u.merge(state, JSON.parse(localStorage.state));
		}
		else if (localStorage.settings) {
			var legacyState = Dabblet.state.legacy(JSON.parse(localStorage.settings));
			
			localStorage.state = JSON.stringify(legacyState);
			
			localStorage.removeItem('settings');
			
			state = $u.merge(state, legacyState)
		}
	}
	
	Dabblet.state.restore(state);
});

$$('.editor.page > pre').forEach(function(pre){
	new Editor(pre);
});

$u.event.bind(template, {
	keypress: function(evt) {
		var char = String.fromCharCode(evt.charCode);
	
		return !(char && 'rhc'.indexOf(char.toLowerCase()) === -1) || evt.keyCode <= 13;
	},
	
	input: function() {
		var regex = /^([rhc]{1,10}(\r?\n|\r)){0,9}[rhc]{1,10}$/gi,
			code = template.value;
	
		if(!regex.test(/^([rhc]{1,10}(\r?\n|\r)){0,9}[rhc]{1,10}$/gi)) {
			var ss = template.selectionStart,
			    se = template.selectionEnd;
			
			code = code.replace(/[^rhc\r\n]/gi, '')
			           .replace(/^([rhc]{10})[rhc]+$/gim, '$1')
			           .replace(/^(([rhc]{1,10}(\r?\n|\r)){9}[rhc]{1,10})[rhc\r\n]+$/gi, '$1');
			
			template.value = code;
			
			template.selectionStart = ss,
			template.selectionEnd = se;
		}
		
		var info = Dabblet.view.applyTemplate(code);
		
		if(info.valid) {
			var tab = Dabblet.view.tab,
			    title = $('span', tab.parentNode);
			    
			title.innerHTML = Dabblet.view.title(code).replace(/&/g, '<i class=amp>&amp;</i>');
		}
	}
}, true);

seethrough.onclick = function() {
	Dabblet.view.applySeethrough(this.checked);
	
	Dabblet.state.store();
};

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
		}
		
		if(evt.shiftKey) {
			if(code === 219) {
				return !Dabblet.view.previous();
			}
			else if (character === ']' || code === 221) {
				// Go to next tab
				return !Dabblet.view.next();
			}
		}
		
		if (character > 0 && character < 10) {
			var tab = character == 9?  Dabblet.view.tabs.length : +character;
				
			if(Dabblet.view.goto(tab)) {
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

$u.event.bind(Dabblet.view.container, {
	click: function(evt) {
		var target = evt.target,
		    tag = target.nodeName.toLowerCase();
		
		if(tag === 'div') {
			return;
		}
		
		target = tag === 'i'? target.parentNode : target;
		var label = tag === 'label'? target : target.parentNode;
		var input = tag === 'input'? target : $('input', label);
		
		Dabblet.view.goto(input);
		
		if(Dabblet.view.editing) {
			template.value = input.value;
			template.oninput();
			
			seethrough.checked = input.hasAttribute('data-seethrough');
			seethrough.onclick();
			
			var settings = window['layout-settings'],
				offsets = $u.offset(label);
	
			settings.style.left = offsets.left + label.offsetWidth/2 + 'px';
			settings.style.display = 'block';
			
			setTimeout(function(){
				template.focus();
				
				template.onblur = function() {
					input.value = template.value;
					
					var wutAttribute = (seethrough.checked? 'set' : 'remove') + 'Attribute';
					input[wutAttribute]('data-seethrough', '');
					
					settings.style.display = '';
					
					Dabblet.state.store();
					
					template.onblur = null;
				}
			}, 100);
		}
	},
		
	tabcountchange: function() {
		// Reindex tabs
		var tabs = Dabblet.view.tabs;
		
		for (var i=-1, tab; tab = tabs[++i];) {
			tab.setAttribute('data-index', i+1);
			tab.parentNode.title = '⌘' + (i+1);
		}
	}
});

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

$u.event.bind('label > input[type="checkbox"]', 'click', function(){
	var parent = this.parentNode;
	parent && parent.classList[this.checked? 'add' : 'remove']('checked');
});