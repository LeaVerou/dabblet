/**
 * Code only used in user profiles (e.g dabblet.com/user/leaverou)
 * TODO reduce globals
 */
 
(function (html) {

var username = (location.pathname.match(/\/user\/(\w+)/i) || [,''])[1].trim();

if(username) {
	document.title = username + '’s profile';
	
	$('.nickname', profile).textContent = username;
	
	addEventListener('gotUserInfo', function() {
		if(window.user && username.toLowerCase() === window.user.login.toLowerCase()) {
			// Viewing own profile
			html.classList.add('own');
		}
		else {
			// Viewing somebody else’s profile. Do we follow them?
			gist.request({
				path: 'user/following/' + username,
				accepted: [404],
				callback: function(data, xhr) {
					var following = xhr.status == 204;

					if (following) {
						html.classList.add('following');
					}
				}
			});
		}
	});
	
	gist.request({
		path: 'users/' + username,
		callback: function(user, xhr) {
			UserProfile.user = user;
			
			$u.event.fire(window, 'hashchange');
						
			$('.tab[href="#following"] .count').textContent = user.following;
			$('.tab[href="#followers"] .count').textContent = user.followers;
			
			$('img', profile).src = user.avatar_url;
			
			
			if (user.name) {
				$('.fn', profile).textContent = user.name || '';
			}
			
			$('.nickname', profile).textContent = user.login
			
			$('.note', profile).textContent = user.bio || '';
			$('.adr', profile).textContent = user.location || 'Earth';
			
			$u.element.prop($('.url', profile), {
				textContent: prettyUrl(user.blog || ''),
				href: user.blog || ''
			});
			
			$u.element.prop($('.github', profile), {
				textContent: user.login,
				href: user.html_url || ''
			});
		}
	});
}

var Templates = {
	user: function(user) {
		return $u.element.create('article', {
			properties: {
				className: 'user vcard'
			},
			contents: {
				tag: 'a',
				properties: {
					href: location.protocol + '//' + location.host + '/user/' + user.login
				},
				contents: [{
						tag: 'img',
						properties: {
							className: 'photo',
							src: user.avatar_url
						}
					}, {
						tag: 'h1',
						className: 'nickname',
						contents: user.login
				}],
			}
		});
	},
	
	dabblet: function(gist) {
		var createdAt = prettyDate(gist.created_at),
			    updatedAt = prettyDate(gist.updated_at);
		
		return $u.element.create('article', {
			properties: {
				className: 'dabblet',
			},
			contents: [{
						tag: 'a',
					properties: {
						href: 'http://dabblet.com/gist/' + gist.id,
						target: '_blank'
					}
				}, {
					tag: 'iframe',
					attributes: {
						'data-src': 'http://result.dabblet.com/gist/' + gist.id,
						'scrolling': 'no'
					}
				}, {
					tag: 'div',
					properties: {
						className: 'info'
					},
					contents: [
						gist.comments > 0? {
							tag: 'a',
							properties: {
								className: 'comments',
								href: 'https://gist.github.com/' + gist.id + '#comments',
								title: 'Comments',
								target: '_blank'
							},
							contents: gist.comments
						} : '',
						{
							tag: 'h1',
							contents: gist.description
						},
						{
							tag: 'p',
							properties: {
								className: 'date'
							},
							contents: (createdAt !== updatedAt? [
								'Created ', {
									tag: 'time',
									attributes: { 
										datetime: gist.created_at,
										title: gist.created_at
									},
									contents: createdAt
								},
								', last updated '
							] : []).concat([{
									tag: 'time',
									attributes: {
										datetime: gist.updated_at,
										title: gist.updated_at
									},
									contents: updatedAt
								}])
						}
					]
				}
			],
			inside: '#dabblets'
		});
	}
}

addEventListener('hashchange', function() {
	$$('.tab').forEach(function(tab) {
		tab.classList[tab.hash === location.hash? 'add' : 'remove']('active');
	});
	
	$('#dabblets').classList[location.hash? 'remove' : 'add']('active');
	
	switch (location.hash) {
		case '#dabblets':
		case '':
			UserProfile.loadDabblets();
			break;
		case '#following':
			UserProfile.loadFollowing();
			break;
		case '#followers':
			UserProfile.loadFollowers();
	}
});

window.UserProfile = {
	loadDabblets: function() {
		UserProfile.loadBits({
			section: dabblets,
			url: 'users/' + username + '/gists',
			render: function (gist, section) {
				var files = gist.files;
				
				if('dabblet.css' in files && 'dabblet.html' in files) {
					Templates.dabblet(gist);
				}
			},
			afterRender: function(page) {
				UserProfile.loadPreviews();
				
				if(page == 1) {
					$u.event.bind(window, ['scroll', 'resize'], function (e) {
						$$('iframe[data-src].scrolled-off').forEach(function(iframe) {
							iframe.classList.remove('scrolled-off');
						});
						
						UserProfile.loadPreviews();
					});
				}
			}
		});
	},
	
	loadFollowing: function() {
		UserProfile.loadBits({
			section: following,
			url: 'users/' + username + '/following',
			render: function (user, section) {
				section.appendChild(Templates.user(user));
			}
		});
	},
	
	loadFollowers: function() {
		UserProfile.loadBits({
			section: followers,
			url: 'users/' + username + '/followers',
			render: function (user, section) {
				section.appendChild(Templates.user(user));
			}
		});
	},
	
	loadBits: function (config) {
		var section = config.section;
		    
		var page = +section.getAttribute('data-next');
		
		if(page < 1) {
			return;
		}
		
		gist.request({
			path: config.url + '?page=' + page,
			callback: function(bits, xhr) {
				section.style.display = 'none';
				
				var nextPage = ((xhr.getResponseHeader('Link') + '').match(/(\d+)>; rel="next"/) || [,0])[1];
				
				section.setAttribute('data-next', nextPage);
				
				if(!nextPage) {
					$('.more', section).style.display = 'none';
				}
				
				for(var i=0, bit; bit = bits[i++];) {
					config.render(bit, section);
				}
				
				section.style.display = '';
				
				config.afterRender && config.afterRender(page);
			}
		});
	},
	
	loadPreviews: function() {
		var iframe = $('iframe[data-src]:not(.scrolled-off)');
		
		// Does it exist?
		if(!iframe) {
			return;
		}
		
		var offset = $u.offset(iframe);
		
		// Is it visible?
		var visible = offset.top < innerHeight + pageYOffset && offset.top + 250 > pageYOffset;
		
		if(!visible) {
			// Mark it and move on
			iframe.classList.add('scrolled-off');
			UserProfile.loadPreviews();
			return;
		}

		iframe.src = iframe.getAttribute('data-src');
		iframe.removeAttribute('data-src');
		iframe.classList.add('loading');
		
		iframe.onload = function () {
			iframe.classList.remove('loading');
			UserProfile.loadPreviews();
		};
	},
	
	setFollow: function(following) {
		if (!window.user || !UserProfile.user) {
			return;
		}
		
		gist.request({
			method: following? 'PUT' : 'DELETE',
			path: 'user/following/' + username,
			callback: function(data, xhr) {
				if (xhr.status == 204) {
					html.classList[following? 'add' : 'remove']('following');
				}
			}
		});
	}
}

// Load iframes asynchronously, one at a time


function prettyUrl(url) {
	return url && url.replace(/^http:\/\/|\/$/g, '')
	                 .replace(/^www\./, '');
}

// Takes an ISO time and returns a string representing how
// long ago the date represents.
// Inspired by John Resig's Pretty Date function 
function prettyDate(time){
	var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
		now = new Date(),
		diff = ((now.getTime() + now.getTimezoneOffset()*60000 - date.getTime()) / 1000),
		day_diff = Math.floor(diff / 86400);
			
	if ( isNaN(day_diff) || day_diff < 0 ) {
		return time;
	}
	
	var number, unit;
			
	if(diff < 60) {
		return 'just now';
	}
		
	if(diff < 3600) {
		number = Math.round(diff / 60);
		unit = 'minute';
	}
	else if(diff < 86400) {
		number = Math.round(diff / 3600);
		unit = 'hour';
	}
	else if (day_diff == 1) {
		return 'yesterday';
	}
	else if (day_diff < 7) {
		number = day_diff;
		unit = 'day';
	}
	else if (day_diff < 31) {
		number = Math.ceil( day_diff / 7 );
		unit = 'week'
	}
	else {
		number = Math.round(day_diff/30);
		unit = 'month'; 
	}
	
	return (number === 1? 'a' : number) + ' ' + unit + (number === 1? '' : 's') + ' ago';
}

})(document.documentElement);