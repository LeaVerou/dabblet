function $(expr, con) { return (con || document).querySelector(expr); }
function $$(expr, con) { return [].slice.call((con || document).querySelectorAll(expr)); }

// Webkit does this anyway
$$('[id]').forEach(function(element) {
	window[element.id] = element;
});

var gist = {
	oauth: [
		// Step 1: Ask permission
		function(callback){
			gist.oauth.callback = callback;

			var popup = open('https://github.com/login/oauth/authorize' +
				'?client_id=da931d37076424f332ef' +
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

		xhr({
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

	load: function(id){
		gist.request({
			id: id || gist.id,
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

				if(settings) {
					try { settings = JSON.parse(settings.content); }
					catch(e) { return; }

					Dabblet.settings.apply(settings);
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

var UndoManager = function(elm) {
	this.element = elm;

	this.undoStack = [];
	this.redoStack = [];
};

UndoManager.prototype = {
	action: function(action) {
		if(!action || !(action.length || action.action || action.add || action.del)) {
			return;
		}

		var lastAction = this.undoStack.pop() || null;

		if(lastAction) {
			var push = lastAction.action || action.action
					|| lastAction.length || action.length
					|| (action.del && lastAction.add)
					|| (action.add && !lastAction.add)
					|| (lastAction.start + lastAction.add.length - lastAction.del.length != action.start);

			if(push) {
			  	this.undoStack.push(lastAction);
			  	this.undoStack.push(action);
			}
			else if(lastAction) {
				var combined = this.chain(lastAction, action);

				this.undoStack.push(combined);
			}
		}
		else {
			this.undoStack.push(action);
		}

		this.redoStack = [];

		//console.log(this.undoStack);
	},

	undo: function() {
		//console.log(this.undoStack);

		var action = this.undoStack.pop();

		if(!action) {
			return;
		}

		this.redoStack.push(action);

		this.applyInverse(action);

		this.element.onkeyup();
	},

	redo: function() {
		//console.log(this.redoStack);

		var action = this.redoStack.pop();

		if(!action) {
			return;
		}

		this.undoStack.push(action);

		this.apply(action);

		this.element.onkeyup();
	},

	chain: function(action1, action2) {
		return {
			add: action1.add + action2.add,
			del: action2.del + action1.del,
			start: action1.start
		}
	},

	apply: function(action) {
		if(action.length) {
			for(var i=0; i<action.length; i++) {
				this.apply(action[i]);
			}
			return;
		}

		var element = this.element,
			start = action.start;

		if(action.action) {
			Dabblet.codeActions.call(element, action.action, {
				inverse: action.inverse,
				start: start,
				end: action.end,
				noHistory: true
			});
		}
		else {
			// add added chars & remove deleted chars
			element.textContent = element.textContent.splice(start, action.del.length, action.add);

			element.setSelectionRange(start, start + action.add.length);
		}
	},

	applyInverse: function(action) {
		if(action.length) {
			for(var i=action.length-1; i>=0; i--) {
				this.applyInverse(action[i]);
			}
			return;
		}

		var element = this.element,
			start = action.start;

		if(action.action) {
			Dabblet.codeActions.call(element, action.action, {
				inverse: !action.inverse,
				start: start,
				end: action.end,
				noHistory: true
			});
		}
		else {
			// remove added chars & add deleted chars
			element.textContent = element.textContent.splice(start, action.add.length, action.del);

			element.setSelectionRange(start, start + action.del.length);
		}
	}
};

var Dabblet = {
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

	update: {
		CSS: function(code) {
			if(!result.contentWindow.style) {
				result.onload();
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

	codeActions: function(action, options) {
		options = options || {};

		var text = this.textContent,
			ss = options.start || this.selectionStart,
			se = options.end || this.selectionEnd,
			before = text.slice(0,ss),
			after = text.slice(se),
			selection = ss === se? '' : text.slice(ss,se),
			textAction;

		switch (action) {
		  case 'indent':
		  	if(selection) {
		  		var lf = before.lastIndexOf('\n') + 1;

				if(options.inverse) {
					if(/\s/.test(before.charAt(lf))) {
						before = before.splice(lf, 1);

						ss -= 1;
						se -= 1;
					}

					selection = selection.replace(/\r?\n\s/g, '\n');
					var offset = selection.length - (se - ss);

					se += offset;
				}
				else {
					before = before.splice(lf, 0, '\t');
					selection = selection.replace(/\r?\n/g, '\n\t');

					var offset = selection.length - (se - ss);

					ss++;
					se += offset + 1;
				}

				textAction = {
					action: action,
					start: ss,
					end: se,
					inverse: options.inverse
				};
			}
			else {
				if(options.inverse) {
					return false;
				}
				else {
					textAction = {
						add: '\t',
						del: '',
						start: ss
					};

					before = before + '\t';

					ss++;
					se++;
				}
			}

			break;

		  case 'newline':
		  	var lf = before.lastIndexOf('\n') + 1,
				indent = (before.slice(lf).match(/^\s+/) || [''])[0];

			textAction = {
				add: '\n' + indent,
				del: selection,
				start: ss
			};

			before += '\n' + indent;
			selection = '';

			ss += indent.length + 1;
			se = ss;

			break;

		  case 'comment':
			var css = this.id === 'css',
				open = css? '/*' : '<!--',
				close = css? '*/' : '-->';

			var start = before.lastIndexOf(open),
				end = after.indexOf(close),
				closeBefore = before.lastIndexOf(close),
				openAfter = after.indexOf(start);

			if(start > -1 && end > -1
			   	&& (start > closeBefore || closeBefore === -1)
			   && (end < openAfter || openAfter === -1)
			   ) {
				// Uncomment
				before = before.splice(start, open.length);
				after = after.splice(end, close.length);

				textAction = [{
					add: '',
					del: open,
					start: start
				}, {
					add: '',
					del: close,
					start: before.length + selection.length + end
				}];

				ss -= open.length;
				se -= open.length;
			}
			else {
				// Comment
				if(selection) {
					// Comment selection
					selection = open + selection + close;

					textAction = [{
						add: open,
						del: '',
						start: ss
					}, {
						add: close,
						del: '',
						start: open.length + se
					}];
				}
				else {
					// Comment whole line
					var start = before.lastIndexOf('\n') + 1,
						end = after.indexOf('\n');

					if(end === -1) {
						end = after.length;
					}

					before = before.splice(start, 0, open);

					after = after.splice(end, 0, close);

					textAction = [{
						add: open,
						del: '',
						start: start
					}, {
						add: close,
						del: '',
						start: before.length + end
					}];
				}

				ss += open.length;
				se += open.length;
			}

			break;
		}

		this.textContent = before + selection + after;

		if(textAction && !options.noHistory) {
			this.undoManager.action(textAction);
		}

		this.setSelectionRange(ss, se);

		this.onkeyup();
	},

	settings: {
		cached: {},

		handlers: {
			page: function(page) {
				var currentid = document.body.getAttribute('data-page'),
					current = window[currentid],
					input = window['page-' + page],
					pre = window[page];

				if(current == pre) {
					return;
				}

				if(current) {
					var ss = current.selectionStart,
						se = current.selectionEnd;

					ss && current.setAttribute('data-ss', ss);
					se && current.setAttribute('data-se', se);
				}

				if(input.value != page || input.checked === false) {
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
			},

			autohide_topbar: function(enabled) {
				Dabblet.settings.cached.autohide_topbar = enabled;

				var header = $('header'),
					cls = header.className.split(' '),
					arr = [];

				cls.forEach(function(item, index) {
					if (item && item !== 'sticky') { arr[index] = item; }
				});

				if (!enabled) { arr.push('sticky'); }
				header.className = (arr.length > 1) ? arr.join(' ') : (arr[0]) ? arr[0] : '';
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

		return 'You have unsaved changes.';
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

	Dabblet.settings.apply();

	var path = location.pathname.slice(1);

	if(path) {
		// Viewing a gist?
		if(gist.id = (path.match(/\bgist\/(\d+)/i) || [])[1]) {
			css.textContent = html.textContent = '';
			gist.load();
		}
	}

	if(!gist.id) {
		if(localStorage['dabblet.css'] !== undefined) {
			css.textContent = localStorage['dabblet.css'];
		}

		if(localStorage['dabblet.html'] !== undefined) {
			html.textContent = localStorage['dabblet.html'];
		}

		if(localStorage.settings) {
			Dabblet.settings.apply(JSON.parse(localStorage.settings));
		}
	}
});

$$('pre').forEach(function(pre){
	pre.undoManager = new UndoManager(pre);

	pre.onkeydown = function(evt) {
		var cmdOrCtrl = evt.metaKey || evt.ctrlKey;

		switch(evt.keyCode) {
			case 8: // Backspace
				var ss = this.selectionStart,
					se = this.selectionEnd,
					length = ss === se? 1 : Math.abs(se - ss),
					start = se - length;

				this.undoManager.action({
					add: '',
					del: this.textContent.slice(start, se),
					start: start
				});

				break;
			case 9: // Tab
				if(!cmdOrCtrl) {
					Dabblet.codeActions.call(this, 'indent', {
						inverse: evt.shiftKey
					});
					return false;
				}
			case 13:
				Dabblet.codeActions.call(this, 'newline');
				return false;
			case 90:
				if(cmdOrCtrl) {
					this.undoManager[evt.shiftKey? 'redo' : 'undo']();
					return false;
				}

				break;
			case 191:
				if(cmdOrCtrl) {
					Dabblet.codeActions.call(this, 'comment');
					return false;
				}

				break;
		}
	};

	pre.onkeypress = function(evt) {
		var cmdOrCtrl = evt.metaKey || evt.ctrlKey,
			code = evt.charCode,
			ss = this.selectionStart,
			se = this.selectionEnd;

		if(code && !cmdOrCtrl) {
			var character = String.fromCharCode(code);

			this.undoManager.action({
				add: character,
				del: ss === se? '' : this.textContent.slice(ss, se),
				start: ss
			});
		}
	};

	pre.oncut = function() {
		ss = this.selectionStart,
		se = this.selectionEnd,
		selection = ss === se? '': this.textContent.slice(ss, se);

		if(selection) {
			this.undoManager.action({
				add: '',
				del: selection,
				start: ss
			});

			gist.saved = false;
		}
	};

	pre.onpaste = function() {
		var that = this,
			ss = this.selectionStart,
			se = this.selectionEnd,
			selection = ss === se? '': this.textContent.slice(ss, se);

		gist.saved = false;

		setTimeout(function(){
			var newse = that.selectionEnd,
				pasted = that.textContent.slice(ss, newse);

			that.undoManager.action({
				add: pasted,
				del: selection,
				start: ss
			});

			that.innerHTML = that.innerHTML
								.replace(/<br\b.*?>|(<div\b.*?>)+/gi, '\n')
								.replace(/<\/div>/gi, '')
								.replace(/&nbsp;/gi, ' ');

			ss += pasted.length;

			that.setSelectionRange(ss, ss);

			that.onkeyup();
		}, 10);
	};

	pre.onkeyup = function(evt) {
		var keyCode = evt && evt.keyCode || 0,
			code = this.textContent,
			id = this.id;

		if([
			9, 91, 93, 16, 17, 18, // modifiers
			20, // caps lock
			13, // Enter (handled by keydown)
			112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, // F[0-12]
			27 // Esc
		].indexOf(keyCode) > -1) {
			return;
		}

		if(keyCode !== 37 && keyCode !== 39) {
			var ss = this.selectionStart,
				se = this.selectionEnd;

			Highlight.init(this);

			// Dirty fix to #2
			if(!/\n$/.test(code)) {
				this.innerHTML = this.innerHTML + '\n';
			}

			if(ss !== null || se !== null) {
				this.setSelectionRange(ss, se);
			}

			if(id === 'css') {
				document.title = Dabblet.title(code) + ' ✿ dabblet.com';

				Dabblet.update.CSS(code);
			}
			else {
				Dabblet.update.HTML(code);
			}

			if(keyCode) {
				gist.saved = false;
			}
		}

		this.onclick();
	};

	pre.onclick = function(evt) {
		if(!self.Previewer) {
			return;
		}

		if(this.id !== 'css') { return; }

		var selection = getSelection();

		if(selection.rangeCount) {
			var range = selection.getRangeAt(0),
				element = range.startContainer;

			if(element.nodeType == 3) {
				element = element.parentNode;
			}

			var type = Previewer.get(element);

			if(type) {
				Previewer.active = element;
				Previewer.s[type].token = element;
			}
			else {
				Previewer.hideAll();
				Previewer.active = null;
			}
		}
	}

	pre.onblur = function() {
		if(!gist.saved) {
			// Save draft
			localStorage['dabblet.css'] = css.textContent;
			localStorage['dabblet.html'] = html.textContent;
		}

		self.Previewer && Previewer.hideAll();
	};

	pre.onmouseover = function(evt) {
		if(!self.Previewer) {
			return;
		}

		var target = evt.target,
		    type = Previewer.get(target);

		if (type) {

			var previewer = Previewer.s[type];

			if (previewer.token != target) {
				previewer.token = target;

				target.onmouseout = function() {
					previewer.token = this.onmouseout = null;

					// Show the previewer again on the active token
					var active = Previewer.active;

					if (active) {
						var type = Previewer.get(active);
						Previewer.s[type].token = active;
					}
				}
			}
		}
	};
});

css.onfocus = function() {
	script('/code/incrementable.js', function() {
		new Incrementable(css, function(evt) {
			if(evt.altKey) {
				if(evt.shiftKey) { return 10; }

				if(evt.ctrlKey) { return .1; }

				return 1;
			}

			return 0;
		});
		css.onfocus = null;
	});
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
			case '1':
				var page = 'css';
				break;
			case '2':
				var page = 'html';
				break;
			case '3':
				var page = 'result';
				break;
		}

		var currentPage = Dabblet.settings.current('page');

		if(evt.shiftKey) {
			if(code === 219) {
				// Go to previous tab
				var page = ({
					'html': 'css',
					'result': 'html'
				})[currentPage];
			}
			else if (character === ']' || code === 221) {
				// Go to next tab
				var page = ({
					'css': 'html',
					'html': 'result'
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

// Pure CSS menus aren't accessible, we need to add some JS :(
var header = $('header');
$$('header a, header input, header button, header [tabindex="0"]').forEach(function(focusable){
	focusable.onfocus = function(){
		var ancestor = this;

		do {
			ancestor = ancestor.parentNode;
			ancestor.classList.add('focus')
		} while(ancestor && ancestor != document.body);
	};

	focusable.onblur = function() {
		var ancestor = this;

		do {
			ancestor = ancestor.parentNode;
			ancestor.classList.remove('focus')
		} while(ancestor && ancestor != document.body);
	};
});