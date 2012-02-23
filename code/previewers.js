/**
 * Code for the value previewers
 */
 
(function(){

var _ = self.Previewer = function(id, updater, type) {
	_.s[id] = this;
	
	this.previewer = document.getElementById(id);
	this.updater = updater;
	this.type = type || 'css';
	this._token = null;
	
	Object.defineProperty(this, 'token', {
		get: function() {
			return this._token;
		},
		set: function(token) {
			// Hide all previewers except this
			if(token !== null) {
				_.hideAll(id);
			}

			var oldToken = this._token,
				changedToken = oldToken != token,
				previewer = this.previewer,
			    style = previewer.style;
			
			this._token = token;
			
			if(token) {
				var valid = this.updater.call(previewer, token.textContent);

				if(valid) {
					previewer.classList.add('active');
					
					if(changedToken) {
						var offsets = $u.offset(token), property;
							
						
						if (offsets.top - previewer.offsetHeight > 0) {
							property = 'bottom';
							previewer.classList.remove('flipped');
						}
						else {
							property = 'top';
							previewer.classList.add('flipped');
						}
						
						style.bottom = style.top = '';
						style[property] = offsets[property] + token.offsetHeight + 'px';
						style.left = offsets.left + Math.min(200, token.offsetWidth/2) + 'px';
					}
				}
			}
			
			if(!token || !valid && oldToken) {
				previewer.classList.remove('active');
				previewer.style.display = '';
			}
		}
	});
}

_.prototype = {
	
};

_.s = {};

_.hideAll = function(except) {
	var all = _.s;
	
	for(var id in all) {
		if(!except || except !== id) {
			all[id].token = null;
		}
	}
};

_.get = function(token) {
	var type = (token && token.className.match(/^token ([\w-]+)/) || [])[1];
	
	return type in _.s? type : null;
}

_._active = null;
Object.defineProperty(_, 'active', {
	get: function() { return this._active; },
	set: function(token) {
		var oldToken = this._active;
		
		this._active = token;
		
		if(oldToken) {
			oldToken.removeAttribute('data-active');
		}
		
		if(token) {
			token.setAttribute('data-active', '');
		}
	}
});

})();

/**
 * Define previewers
 */
new Previewer('color', function(code) {
	var style = this.style;
						
	style.backgroundColor = '';
	style.backgroundColor = code;
	
	return !!style.backgroundColor;
});

new Previewer('abslength', function(code) {
	var style = this.style,
		abs = code.replace(/^-/, '');
						
	style.width = '';
	style.width = abs;
	
	var valid = !!style.width;
	
	if(valid) {
		var num = parseFloat(abs),
			unit = (code.match(/[a-z]+$/i) || [])[0];
		
		style.marginLeft = -num/2 + unit;
		
		style.display = 'block';
		
		var width = this.offsetWidth;

		if(width > innerWidth || width < 9) {
			valid = false;
		}
		else {
			var size = width < 20? 'small' : 'normal';
			this.setAttribute('data-size', size);
		}
	}
	
	return valid;
});

new Previewer('time', function(code) {
	if(code === '0s') {
		return false;
	}
	
	var num = parseFloat(code),
		unit = (code.match(/[a-z]+$/i) || [])[0];

	$$('animate', this).forEach(function(animation) {
		animation.setAttribute('dur', 2*num + unit);
	});
	
	return true;
});

new Previewer('angle', function(code) {
	var num = parseFloat(code),
		unit = (code.match(/[a-z]+$/i) || [])[0],
		max, percentage;
		
	switch(unit) {
		case 'deg':
			max = 360;
			break;
		case 'grad':
			max = 400;
			break;
		case 'rad':
			max = 2 * Math.PI;
			break;
		case 'turn':
			max = 1;
	}
	
	percentage = 100 * num/max;
	percentage %= 100;
	
	this[(num < 0? 'set' : 'remove') + 'Attribute']('data-negative', '');
	
	$('circle', this).setAttribute('stroke-dasharray', Math.abs(percentage) + ',500')
	
	return true;
});

new Previewer('fontfamily', function(code) {
	var style = this.style;
						
	style.fontFamily = '';
	style.fontFamily = code;

	return !!style.fontFamily;
});

new Previewer('gradient', function(code) {
	var inner = this.firstChild,
		style = inner.style;
	
	style.cssText = StyleFix.fix('background-image: ' + code);

	return !!style.backgroundImage;
});

new Previewer('easing', function(code) {
	code = ({
		'linear': '0,0,1,1',
		'ease': '.25,.1,.25,1',
		'ease-in': '.42,0,1,1',
		'ease-out': '0,0,.58,1',
		'ease-in-out':'.42,0,.58,1'
	})[code] || code;
	
	var p = code.match(/-?\d*\.?\d+/g);
	
	if(p.length === 4) {
		p = p.map(function(p, i) { return (i % 2? 1 - p : p) * 100; });
			
		$('path', this).setAttribute('d', 'M0,100 C' + p[0] + ',' + p[1] + ', ' + p[2] + ',' + p[3] + ', 100,0');
		
		var lines = $$('line', this);
		
		lines[0].setAttribute('x2', p[0]);
		lines[0].setAttribute('y2', p[1]);
		lines[1].setAttribute('x2', p[2]);
		lines[1].setAttribute('y2', p[3]);
		
		return true;
	}
	
	return false;
});

new Previewer('url', function(code) {
	var href = code.replace(/^url\(('|")?|('|")?\)$/g, ''),
		img = $('img',this),
		that = this;
	
	img.src = href;
	
	img.onload = function() {
		this.className = '';
		that.style.marginLeft = '-' + this.offsetWidth/2 + 'px';
	};
	
	img.onerror = function() {
		this.onload();
		this.className = 'error';
	};
	
	return true;
});

new Previewer('entity', function(code) {
	if(code.charAt(0) === '\\') {
		this.textContent = String.fromCharCode(parseInt(code.slice(1), 16));
	}
	else {
		this.innerHTML = code;
	}
	
	return this.textContent.length === 1;
});