(function() {

/**
 * Generic utils.
 */

var utils = window.utils = {};

/**
 * Extract `title` and `body` components
 * from a `comment`.
 *
 * @param {String} comment
 * @return {Object} item
 * @api public
 */

utils.parseComment = function(comment) {
  var matchCommentsRegexp = /(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[(\w\s\']*)|(\<![\-\-\s\w\>\/]*\>)/gm;
  var replaceRegexp = /^\/\*\*? |^ *\* ?|^\s|^(\/\*[\*\!]?)+\s*.?$| ?\*\/$|\/$/gm;

  var str = comment.match(matchCommentsRegexp)[0];
  str = str.replace(replaceRegexp, '');
  var parts = str.split(/\n{1,}/).filter(Boolean);

  var item = {};
  item.title = parts[0];
  item.body = parts.slice(1).join('\n');

  return item;
};

}());