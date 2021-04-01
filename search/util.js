"use strict";
// @ts-nocheck
var _cheerio = require('cheerio');
var util = {};
module.exports = util;
util._getScripts = _getScripts;
util._findLine = _findLine;
util._between = _between;
function _getScripts(text) {
    var $ = _cheerio.load(text);
    var scripts = $('script');
    var buffer = '';
    for (var i = 0; i < scripts.length; i++) {
        var el = scripts[i];
        var child = el && el.children[0];
        var data = child && child.data;
        if (data) {
            buffer += data + '\n';
        }
    }
    return buffer;
}
function _findLine(regex, text) {
    var cache = _findLine.cache || {};
    _findLine.cache = cache;
    cache[text] = cache[text] || {};
    var lines = cache[text].lines || text.split('\n');
    cache[text].lines = lines;
    clearTimeout(cache[text].timeout);
    cache[text].timeout = setTimeout(function () {
        delete cache[text];
    }, 100);
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (regex.test(line))
            return line;
    }
    return '';
}
function _between(text, start, end) {
    var i = text.indexOf(start);
    var j = text.lastIndexOf(end);
    if (i < 0)
        return '';
    if (j < 0)
        return '';
    return text.slice(i, j + 1);
}
