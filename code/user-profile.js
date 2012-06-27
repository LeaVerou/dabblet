/**
 * Code only used in user profiles (e.g dabblet.com/user/leaverou)
 * TODO reduce globals
 */
 
var username = (location.pathname.match(/\/user\/(\w+)/i) || [])[1];

if(username) {
	document.title = username + '’s profile';
	
	var userinfo = $('body > header > h2');
	userinfo.innerHTML = username;
	
	gist.request({
		path: 'users/' + username,
		callback: function(user, xhr) {
			window.profileUser = user;
			
			$u.element.create('img', {
				properties: {
					src: profileUser.avatar_url
				},
				inside: userinfo
			});
		}
	});
	
	gist.request({
		path: 'users/' + username + '/gists',
		callback: function(gists, xhr) {
		
			for(var i=0, gist; gist = gists[i++];) {
				var files = gist.files;
				
				if('dabblet.css' in files && 'dabblet.html' in files) {
					Templates.dabblet(gist);
				}
			}
		}
	});
	
	gist.request({
		path: 'users/' + username + '/following',
		callback: function(users, xhr) {
		
			for(var i=0, user; user = users[i++];) {
				Templates.user(user);
			}
		}
	});
}

var Templates = {
	user: function(user) {
		$u.element.create('article', {
			contents: {
				tag: 'a',
				properties: {
					href: location.protocol + '//' + location.host + '/user/' + user.login
				},
				contents: [{
						tag: 'img',
						properties: {
							src: user.avatar_url
						}
					}, {
						tag: 'h1',
						contents: user.login
				}],
			},
			inside: '#following'
		});
	},
	
	dabblet: function(gist) {
		var createdAt = prettyDate(gist.created_at),
			    updatedAt = prettyDate(gist.updated_at);
		
		$u.element.create('article', {
			contents: [{
					tag: 'h1',
					contents: [{
						tag: 'a',
						properties: {
							href: 'http://dabblet.com/gist/' + gist.id,
							target: '_blank'
						},
						contents: gist.description
					}, ' ', {
						tag: 'a',
						properties: {
							href: 'http://result.dabblet.com/gist/' + gist.id,
							target: '_blank'
						},
						contents: 'Full page'
					}, ' ', {
						tag: 'a',
						properties: {
							href: 'http://gist.github.com/' + gist.id,
							target: '_blank'
						},
						contents: 'Gist'
					}]
				}, {
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
				}, gist.comments > 0? {
					tag: 'p',
					properties: {
						className: 'comments'
					},
					contents: [{
							tag: 'strong',
							contents: gist.comments
						},
						' comments'
					]
				} : ''
			],
			inside: '#dabblets'
		});
	}
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
	
	return number + ' ' + unit + (number === 1? '' : 's') + ' ago';
}