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

var number = /-?\d*\.?\d+/;
	
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

Prism.languages.insertBefore('css', 'important', {
	'gradient': /(\b|\B-[a-z]{1,10}-)(repeating-)?(linear|radial)-gradient\(((rgb|hsl)a?\(.+?\)|[^\)])+\)/gi,
	'color': RegExp.create('\\b{{keyword}}\\b|\\b{{func}}\\B|\\B{{hex}}\\b', {
		keyword: RegExp('^' + colors.join('|') + '$'),
		func: RegExp.create('^(?:rgb|hsl)a?\\((?:\\s*{{number}}%?\\s*,?\\s*){3,4}\\)$', {
			number: number
		}),
		hex: /^#(?:[0-9a-f]{3}){1,2}$/i
	}, 'ig')
});

Prism.languages.insertBefore('css', {
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
	'entity': /\\[\da-f]{1,8}/gi
});

Prism.languages.html = Prism.languages.markup;

})();