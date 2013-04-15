window.Dabblet = $u.attach({
	pages: {
		css: window['css-page'],
		html: window['html-page'], 
		javascript: window['javascript-page'],
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
			localStorage.removeItem('dabblet.js');
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
	
	validate: {
		HTML: function () {
			var code = '<!DOCTYPE html>\n<html>\n<head>\n' + 
			           '<meta charset="utf-8">\n' +
			           '<title>' + Dabblet.title(css.textContent) + '</title>\n</head>\n<body>\n' +
			           html.textContent + '\n</body>\n</html>';

			var form = $u.element.create('form', {
				properties: {
					action: 'http://validator.w3.org/check',
					method: 'POST',
					target: '_blank'
				},
				contents: {
					tag: 'textarea',
					properties: {
						name: 'fragment',
						value: code
					}
				}
			});
			
			document.body.appendChild(form);
			form.submit();
			document.body.removeChild(form);
			
			form = null;
		},
		
		CSS: function () {
			var form = $u.element.create('form', {
				properties: {
					action: 'http://jigsaw.w3.org/css-validator/validator',
					method: 'POST',
					target: '_blank',
					enctype: 'multipart/form-data'
				},
				contents: {
					tag: 'textarea',
					properties: {
						name: 'text',
						value: css.textContent
					}
				}
			});
			
			document.body.appendChild(form);
			form.submit();
			document.body.removeChild(form);
			
			form = null;
		}
	},
	
	update: {
		CSS: function(code) {
			code = code || css.textContent;
			
			var title = Dabblet.title(code),
				raw = code.indexOf('{') > -1;
			
			result.contentWindow.postMessage(JSON.stringify({
				action: 'title',
				data: title + ' ✿ Dabblet result'
			}), '*');
			
			if(!raw) {
				code = 'html{' + code + '}';
			}
			
			var prefixfree = !!Dabblet.settings.cached.prefixfree;
			
			result.contentWindow.postMessage(JSON.stringify({
				action: 'css',
				data: prefixfree? StyleFix.fix(code, raw) : code
			}), '*');
		},
		
		HTML: function(code) {
			code = code || html.textContent;
			
			result.contentWindow.postMessage(JSON.stringify({
				action: 'html',
				data: code
			}), '*');
			
			Dabblet.update.JavaScript();
		},
		
		JavaScript: function(code) {
			code = code || javascript.textContent;
			
			result.contentWindow.postMessage(JSON.stringify({
				action: 'javascript',
				data: code
			}), '*');
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
				
				if(!Dabblet.embedded) {
					pre.focus && pre.focus();
				}
				
				var ss = pre.getAttribute('data-ss'),
					se = pre.getAttribute('data-se');
					
				if((ss || se) && pre.setSelectionRange) {
					setTimeout(function(){
						pre.setSelectionRange(ss, se);
					}, 2);
				}
			},
			
			fontsize: function(size) {
				size = size || 100;
				
				$$('.editor.page').forEach(function(editor) {
					editor.style.fontSize = size + '%';
				});
			},
			
			prefixfree: function(enabled) {
				Dabblet.settings.cached.prefixfree = enabled;
				
				Dabblet.update.CSS();
			}
		},
		
		current: function(name, scope) {
			var settings = {};
			
			var selector = 'input[data-scope' +
							(scope? '="' + scope + '"' : '') + ']' +
							(name? '[name="' + name + '"]' : '');
			
			$$(selector).forEach(function(input){
				var name = input.name,
				    isToggle = input.type === 'radio' || input.type === 'checkbox';
				
				if(!(name in settings)) {
					// Assign default value
					settings[name] = input.hasAttribute('checked') || !isToggle? input.value : '';
				}
				
				if(isToggle) {
					if(input.checked) {
						settings[name] = input.value; 
					}
					else if(input.type === 'checkbox') {
						settings[name] = ''; 
					}
				}
				else {
					settings[name] = input.value;
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
				
				if (input.type === 'radio') {
					(input.onclick = function(evt){
						if(this.checked) {
							Dabblet.settings.applyOne(name, this.value);
						}
					}).call(input);
				}
				else if (input.type === 'checkbox') {
					(input.onclick = function(evt){
						Dabblet.settings.applyOne(name, this.checked? this.value : '');
					}).call(input);
				}
				else {
					(input['oninput' in input? 'oninput' : 'onclick'] = function(evt){
						Dabblet.settings.applyOne(name, this.value);
					}).call(input);
				}
			});
			
			// Update cached settings
			this.cached = this.current();
		},
		
		applyOne: function(name, value) {			
			var current = this.current(name),
				controls = document.getElementsByName(name);

			for(var i=0; i<controls.length; i++) {
				var control = controls[i];
				
				if(control.type === 'checkbox' || control.type === 'radio') {
					control.checked = control.value == value;
				}
				else {
					control.value = value;
				}
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
}, window.Dabblet);

window.onbeforeunload = function(){
	if(!gist.saved) {
		html.onkeyup();
		css.onkeyup();
		javascript.onkeyup();
		
		css.onblur();
		html.onblur();
		javascript.onblur();
		//return 'You have unsaved changes.';
	}
};

result.onload = function(){
	result.loaded = true;
	
	html.onkeyup();
	css.onkeyup();
	javascript.onkeyup();
};

// Fix Chrome bug
setTimeout(function(){
	if(!result.loaded) {
		result.onload();
	}
}, 500);

document.addEventListener('DOMContentLoaded', function() {
	var a = $('h1 > a');
	
	if(parent !== window) {
		Dabblet.embedded = true;
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
	
	if (path) {
		// Viewing a gist?
		var parts = path.match(/\bgist\/([\da-f]+)(?:\/([\da-f]+))?/i);
		if(parts) {
			if('withCredentials' in new XMLHttpRequest) {
				gist.id = parts[1];
				gist.rev = parts[2];
				css.textContent = html.textContent = javascript.textContent = '';
				gist.load();
			}
			else {
				// CORS not supported, redirect to full page result (see #162)
				location.href = location.href.replace('://', '://result.');
			}
		}
	}
	
	if(!gist.id) {	
		if (!/\bpost\b/.test(document.body.className)) {
			if(typeof localStorage['dabblet.css'] === 'string') {
				css.textContent = localStorage['dabblet.css'];
			}
			
			if(typeof localStorage['dabblet.html'] === 'string') {
				html.textContent = localStorage['dabblet.html'];
			}
			
			if(typeof localStorage['dabblet.js'] === 'string') {
				javascript.textContent = localStorage['dabblet.js'];
				
			}
		}
		
		Dabblet.update.JavaScript();
		
		if(typeof localStorage.settings === 'string') {
			Dabblet.settings.apply(JSON.parse(localStorage.settings));
		}
		else {
			Dabblet.settings.apply();
		}
	}
});

$$('.editor.page > pre').forEach(function(editor){
	new Editor(editor);
	
	$u.event.bind(editor, 'contentchange', function(evt) {
		var keyCode = evt.keyCode,
		    id = this.id,
		    code = this.textContent;
		
		if(id === 'css') {
			document.title = Dabblet.title(code) + ' ✿ dabblet.com';
		
			Dabblet.update.CSS(code);
		}
		else if (id === 'html') {
			Dabblet.update.HTML(code);
		}

		if(keyCode) {
			gist.saved = false;
			
			if (id === 'javascript') {
				if (Dabblet.jserror) {
					Dabblet.jserror.className = '';
				}
			}
		}
	});
	
	$u.event.bind(editor.parentNode, 'click', function(evt) {
		$('pre', this).focus();
		
		evt.stopPropagation();
	});
	
	$u.event.bind(editor, 'blur', function (evt) {
		if(!gist.saved) {
			// Save draft
			localStorage['dabblet.css'] = css.textContent;
			localStorage['dabblet.html'] = html.textContent;
			localStorage['dabblet.js'] = javascript.textContent;
		}
	});
});

// Note: Has to be keydown to be able to cancel the event
document.addEventListener('keydown', function(evt) {
	var code = evt.keyCode,
		character = String.fromCharCode(code),
		cmdOrCtrl = evt.metaKey || evt.ctrlKey;
	
	if(cmdOrCtrl && !evt.altKey) {
		switch (character) {
			case 'S':
				gist.save();
				evt.preventDefault();
				return false;
			case 'N':
				if(Dabblet.wipe()) {
					location.pathname = '/';	
				}
				evt.preventDefault();
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
				var page = 'javascript';
				break;
			case '5':
				var page = 'result';
				break;
		}
		
		if (code == 13) {
			Dabblet.update.JavaScript();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
		}
		
		var currentPage = Dabblet.settings.current('page');
		
		if (evt.shiftKey) {
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
		
		if (page) {
			if(currentPage !== page) {
				Dabblet.settings.applyOne('page', page);
				
				evt.stopPropagation();
				evt.preventDefault();
				return false;
			}
		}
		
		if([48, 187, 189].indexOf(code) > -1 // 0, +, -
			&& /^pre$/i.test(document.activeElement.nodeName)) { 
			var fontSize;

			if(code === 48) {
				fontSize = 100;
			}
			else {
				fontSize = (code == 187? 10 : -10) + +Dabblet.settings.current('fontsize');
			}

			Dabblet.settings.applyOne('fontsize', fontSize);
			
			return false;
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
}, true);

onmessage = function(evt) {
	if (true || evt.origin === 'http://localhost' || evt.origin === 'http://dabblet.com') {
		var info = JSON.parse(evt.data),
		    data = info.data;
		
		switch (info.action) {
			case 'jserror':
				Dabblet.jserror = Dabblet.jserror || $u.element.create('div', {
					properties: {
						id: 'jserror'
					},
					inside: document.body
				});
				
				Dabblet.jserror.className = 'active';
				Dabblet.jserror.innerHTML = (data.lineNumber? '<span class="line-number">' + data.lineNumber + '</span>' : '') +
						                    (data.name? '<strong>' + data.name + '</strong>: ' : '') +
						                    (data.message || 'JavaScript Error');
		}
	}
};

(function() {
	// Supports sliders?
	var slider = $u.element.create('input', {
		prop: {
			type: 'range'
		}
	});

	if(slider.type === 'range') {
		document.documentElement.classList.add('supports-range');
	}
		
})();