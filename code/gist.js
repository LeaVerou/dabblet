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
		
		if(!anon && !window.ACCESS_TOKEN) {
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
			url: 'https://api.github.com/' + path + (!o.anon && window.ACCESS_TOKEN? '?access_token=' + ACCESS_TOKEN : ''),
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