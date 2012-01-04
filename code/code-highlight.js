/**
 * Super simple syntax highlighting
 * @author Lea Verou
 */

RegExp.create = function(str, replacements, flags) {
	for(var id in replacements) {
		var replacement = replacements[id],
			idRegExp = RegExp('{{' + id + '}}', 'gi');
		
		if(replacement.source) {
			replacement = replacement.source.replace(/^\^|\$$/g, '');
		}
		
		// Don't add extra parentheses if they already exist
		str = str.replace(RegExp('\\(' + idRegExp.source + '\\)', 'gi'), '(' + replacement + ')');
		
		str = str.replace(idRegExp, '(?:' + replacement + ')');
	}
	
	return RegExp(str, flags);
};

(function(){

var number = /-?\d*\.?\d+/

var _ = self.Highlight = {
	languages: {
		javascript: {
			'comment': /(\/\*[\w\W]*?\*\/)|\/\/.*?(\r?\n|$)/g,
			'string': /(('|").*?(\2))/g, // used to be: /'.*?'|".*?"/g,
			'keyword': /\b(var|let|if|else|while|do|for|return|in|instanceof|function|new|with|typeof)\b/g,
			'boolean': /\b(true|false)\b/g,
			'number': /\b-?(0x)?\d*\.?\d+\b/g,
			'regex': /\/.+?\/[gim]{0,3}/g
		},
		css: {
			'comment': /\/\*[\w\W]*?\*\//g,
			'url': /url\((?:'|")?(.+?)(?:'|")?\)/gi,
			'atrule': /@[\w-]+?(\s+[^{]+)?(?=\s*{)/gi,
			'selector': /[^\{\}\s][^\{\}]+(?=\s*\{)/g,
			'property': /(\b|\B)[a-z-]+(?=\s*:)/ig,
			'gradient': /\b(repeating-)?(linear|radial)-gradient\(((rgb|hsl)a?\(.+?\)|[^\)])+\)/gi,
			'color': null, // added later
			'important': /\B!important\b/gi,
			'abslength': RegExp.create('(\\b|\\B){{number}}{{unit}}\\b', {
					number: number,
					unit: /(cm|mm|in|pt|pc|px)/
				}, 'gi'),
			'easing': RegExp.create('\\b{{bezier}}\\B|\\b{{keyword}}(?=\\s|;|\\}|$)', {
					bezier: RegExp.create('cubic-bezier\\(({{number}},\\s*){3}{{number}}\\)', {
						number: number
					}),
					keyword: /linear|ease(-in)?(-out)?/
				}, 'gi'),
			'time': RegExp.create('(\\b|\\B){{number}}m?s\\b', {
					number: number
				}, 'gi'),
			'angle': RegExp.create('(\\b|\\B){{number}}(deg|g?rad|turn)\\b', {
					number: number
				}, 'gi'),
			'fontfamily': /(("|')[\w\s]+\2,\s*|\w+,\s*)*(sans-serif|serif|monospace|cursive|fantasy)\b/gi,
			'entity': /\\[\da-f]{1,8}/gi,
			'ignore': /&(lt|gt|amp);/gi,
			'punctuation': /[\{\};:]/g
		},
		html: {
			'comment': /&lt;!--[\w\W]*?--(>|&gt;)/g,
			'tag': {
				'pattern': /(&lt;|<)\/?[\w\W]+?(>|&gt;)/gi,
				'inside': {
					'attr-value': {
						'pattern': /[\w-]+=(('|").*?(\2)|[^\s>]+(?=>|&|\s))/gi,
						'inside': {
							'attr-name': /^[\w-]+(?==)/gi,
							'punctuation': /=/g
						}
					},
					'attr-name': /\s[\w-]+(?=\s)/gi,
					'punctuation': /&lt;\/?|&gt;/g
				}
			},
			'entity': /&amp;#?[\da-z]{1,8};/gi
		}
	},
	
	init: function(code, useWorkers, callback) {
		if(!code) {
			return;
		}
		
		var lang = _.languages[code.getAttribute('lang')];
		
		if(!lang) {
			return;
		}
		
		var text = code.textContent
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/\u00a0/g, ' ');
		
		if(useWorkers && self.Worker) {
			if(self.worker) {
				self.worker.terminate();
			}	
				
			self.worker = new Worker('/code-highlight.js');	
			
			worker.onmessage = function(evt) {
				code.innerHTML = evt.data;
				callback && callback();
			};
			
			worker.postMessage(code.getAttribute('lang') + '|' + text);
		}
		else {
			code.innerHTML = _.do(text, lang);
			callback && callback();
		}
	},
	
	do: function(text, tokens) {
		var strarr = [text];
								
		for(var token in tokens) {
			var pattern = tokens[token], 
				inside = pattern.inside;
			pattern = pattern.pattern || pattern;
			
			for(var i=0; i<strarr.length; i++) {
				
				var str = strarr[i];
				
				if(str.token) {
					continue;
				}
				
				pattern.lastIndex = 0;
				var match = pattern.exec(str);
				
				if(match) {
					var to = pattern.lastIndex,
						match = match[0],
						len = match.length,
						from = to - len,
						before = str.slice(0, from),
						after = str.slice(to); 
					
					
					strarr.splice(i, 1);
					
					if(before) {
						strarr.splice(i++, 0, before);
					}
					
					var wrapped = 
						new String(
							_.wrap(
								token,
								inside && (before || after)? _.do(match, inside) : match
							)
						);
					
					wrapped.token = true;
					strarr.splice(i, 0, wrapped);
					
					if(after) {
						
						strarr.splice(i+1, 0, after);
					}
				}
			}
		}

		return strarr.join('');
	},
	
	wrap: function(token, content) {
		return '<span class="token ' + token + (token === 'comment'? '" spellcheck="true' : '') + '">' + content + '</span>' 
	}
}

if(!self.document) {
	// In worker
	self.addEventListener('message', function(evt) {
		var message = evt.data,
			i = message.indexOf('|'),
			lang = message.slice(0,i),
			code = message.slice(i+1);
		
		self.postMessage(_.do(code, _.languages[lang]));
	}, false);
}

// CSS colors
var colors = [
//	'aliceblue',
//	'antiquewhite',
	'aqua',
//	'aquamarine',
//	'azure',
//	'beige',
//	'bisque',
	'black',
//	'blanchedalmond',
	'blue',
//	'blueviolet',
	'brown',
//	'burlywood',
//	'cadetblue',
//	'chartreuse',
//	'chocolate',
//	'coral',
//	'cornflowerblue',
//	'cornsilk',
//	'crimson',
	'cyan',
//	'darkblue',
//	'darkcyan',
//	'darkgoldenrod',
	'darkgray',
//	'darkgreen',
	'darkgrey',
//	'darkkhaki',
//	'darkmagenta',
//	'darkolivegreen',
//	'darkorange',
//	'darkorchid',
//	'darkred',
//	'darksalmon',
//	'darkseagreen',
//	'darkslateblue',
//	'darkslategray',
//	'darkslategrey',
//	'darkturquoise',
//	'darkviolet',
	'deeppink',
//	'deepskyblue',
	'dimgray',
	'dimgrey',
//	'dodgerblue',
//	'firebrick',
//	'floralwhite',
//	'forestgreen',
	'fuchsia',
//	'gainsboro',
//	'ghostwhite',
	'gold',
//	'goldenrod',
	'gray',
	'green',
//	'greenyellow',
	'grey',
//	'honeydew',
//	'hotpink',
	'indianred',
//	'indigo',
//	'ivory',
//	'khaki',
//	'lavender',
//	'lavenderblush',
//	'lawngreen',
//	'lemonchiffon',
//	'lightblue',
//	'lightcoral',
//	'lightcyan',
//	'lightgoldenrodyellow',
	'lightgray',
//	'lightgreen',
	'lightgrey',
//	'lightpink',
//	'lightsalmon',
//	'lightseagreen',
//	'lightskyblue',
//	'lightslategray',
//	'lightslategrey',
//	'lightsteelblue',
//	'lightyellow',
	'lime',
	'limegreen',
//	'linen',
	'magenta',
	'maroon',
//	'mediumaquamarine',
//	'mediumblue',
//	'mediumorchid',
//	'mediumpurple',
//	'mediumseagreen',
//	'mediumslateblue',
//	'mediumspringgreen',
//	'mediumturquoise',
//	'mediumvioletred',
//	'midnightblue',
//	'mintcream',
//	'mistyrose',
//	'moccasin',
//	'navajowhite',
	'navy',
//	'oldlace',
	'olive',
//	'olivedrab',
	'orange',
	'orangered',
	'orchid',
//	'palegoldenrod',
//	'palegreen',
//	'paleturquoise',
//	'palevioletred',
	'papayawhip',
	'peachpuff',
	'peru',
	'pink',
	'plum',
//	'powderblue',
	'purple',
	'red',
//	'rosybrown',
//	'royalblue',
//	'saddlebrown',
	'salmon',
//	'sandybrown',
//	'seagreen',
//	'seashell',
//	'sienna',
	'silver',
//	'skyblue',
//	'slateblue',
	'slategray',
	'slategrey',
	'snow',
//	'springgreen',
//	'steelblue',
	'tan',
	'teal',
	'thistle',
	'tomato',
	'transparent',
	'turquoise',
	'violet',
	'wheat',
	'white',
	'whitesmoke',
	'yellow',
	'yellowgreen'
];

_.languages.css.color = RegExp.create('\\b{{keyword}}\\b|\\b{{func}}\\B|\\B{{hex}}\\b', {
	keyword: RegExp('^' + colors.join('|') + '$'),
	func: RegExp.create('^(?:rgb|hsl)a?\\((?:\\s*{{number}}%?\\s*,?\\s*){3,4}\\)$', {
		number: number
	}),
	hex: /^#(?:[0-9a-f]{3}){1,2}$/i
}, 'ig');

})();