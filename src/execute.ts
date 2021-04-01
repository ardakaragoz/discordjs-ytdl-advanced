"use strict";
var _cheerio = require('cheerio');
var _dasu = require('dasu');
// auto follow off
_dasu.follow = false;
_dasu.debug = false;
var _a = require('./util.js'), _getScripts = _a._getScripts, _findLine = _a._findLine, _between = _a._between;
var MAX_RETRY_ATTEMPTS = 3;
var RETRY_INTERVAL = 314; // ms
var jpp = require('jsonpath-plus').JSONPath;
var _jp = {}! as any;
// @ts-ignore
// const items = _jp.query( json, '$..itemSectionRenderer..contents.*' )
_jp.query = function (json, path) {
    var opts = {
        path: path,
        json: json,
        resultType: 'value'
    };
    return jpp(opts);
};
// @ts-ignore
// const listId = hasList && ( _jp.value( item, '$..playlistId' ) )
_jp.value = function (json, path) {
    var opts = {
        path: path,
        json: json,
        resultType: 'value'
    };
    // @ts-ignore
    var r = jpp(opts)[0];
    return r;
};
// google bot user-agent
// Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)
// use fixed user-agent to get consistent html page documents as
// it varies depending on the user-agent
// the string "Googlebot" seems to give us pages without
// warnings to update our browser, which is why we keep it in
var DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html) (yt-search; https://www.npmjs.com/package/yt-search)';
var _userAgent = DEFAULT_USER_AGENT; // mutable global user-agent
var _url = require('url');
// @ts-ignore
var _envs = {};
Object.keys(process.env).forEach(function (key) {
    var n = process.env[key];
    if (n == '0' || n == 'false' || !n) {
        return _envs[key] = false;
    }
    // @ts-ignore
    _envs[key] = n;
});
// @ts-ignore
var _debugging = _envs.debug;
function debug() {
    if (!_debugging)
        return;
    // @ts-ignore
    console.log.apply(this, arguments);
}
// used to escape query strings
var _querystring = require('querystring');
// @ts-ignore
var _humanTime = require('human-time');
var TEMPLATES = {
    YT: 'https://youtube.com',
    SEARCH_MOBILE: 'https://m.youtube.com/results',
    SEARCH_DESKTOP: 'https://www.youtube.com/results'
};
var ONE_SECOND = 1000;
var ONE_MINUTE = ONE_SECOND * 60;
var TIME_TO_LIVE = ONE_MINUTE * 5;
/**
 * Exports
 **/
// @ts-ignore
module.exports = function (query, callback) {
    return search(query, callback);
};
module.exports.search = search;
module.exports._parseSearchResultInitialData = _parseSearchResultInitialData;
module.exports._parseVideoInitialData = _parseVideoInitialData;
module.exports._parsePlaylistInitialData = _parsePlaylistInitialData;
module.exports._videoFilter = _videoFilter;
module.exports._playlistFilter = _playlistFilter;
module.exports._channelFilter = _channelFilter;
module.exports._liveFilter = _liveFilter;
module.exports._allFilter = _allFilter;
module.exports._parsePlaylistLastUpdateTime = _parsePlaylistLastUpdateTime;
/**
 * Main
 */ // @ts-ignore
function search(query, callback) {
    // support promises when no callback given
    if (!callback) {
        return new Promise(function (resolve, reject) {
            // @ts-ignore
            search(query, function (err, data) {
                if (err)
                    return reject(err);
                resolve(data);
            });
        });
    }
    // @ts-ignore
    var _options;
    if (typeof query === 'string') {
        _options = {
            query: query
        };
    }
    else {
        _options = query;
    }
    // init and increment attempts
    _options._attempts = (_options._attempts || 0) + 1;
    // save unmutated bare necessary options for retry
    var retryOptions = Object.assign({}, _options);
    // @ts-ignore
    function callback_with_retry(err, data) {
        if (err) {
            if (_options._attempts > MAX_RETRY_ATTEMPTS) {
                return callback(err, data);
            }
            else {
                // retry
                debug();
                debug();
                debug();
                var n = _options._attempts;
                var wait_ms = Math.pow(2, n - 1) * RETRY_INTERVAL;
                setTimeout(function () {
                    search(retryOptions, callback);
                }, wait_ms);
            }
        }
        else {
            return callback(err, data);
        }
    }
    // override userAgent if set ( not recommended )
    if (_options.userAgent)
        _userAgent = _options.userAgent;
    // support common alternatives ( mutates )
    _options.search = _options.query || _options.search;
    // initial search text ( _options.search is mutated )
    _options.original_search = _options.search;
    // ignore query, only get metadata from specific video id
    if (_options.videoId) {
        return getVideoMetaData(_options.videoId, callback_with_retry);
    }
    // ignore query, only get metadata from specific playlist id
    if (_options.listId) {
        return getPlaylistMetaData(_options.listId, callback_with_retry);
    }
    if (!_options.search) {
        return callback(Error('yt-search: no query given'));
    }
    work();
    function work() {
        getSearchResults(_options, callback_with_retry);
    }
}
function _videoFilter(video, index, videos) {
    if (video.type !== 'video')
        return false;
    // filter duplicates
    var videoId = video.videoId;
    var firstIndex = videos.findIndex(function (el) {
        return (videoId === el.videoId);
    });
    return (firstIndex === index);
}
function _playlistFilter(result, index, results) {
    if (result.type !== 'list')
        return false;
    // filter duplicates
    var id = result.listId;
    var firstIndex = results.findIndex(function (el) {
        return (id === el.listId);
    });
    return (firstIndex === index);
}
function _channelFilter(result, index, results) {
    if (result.type !== 'channel')
        return false;
    // filter duplicates
    var url = result.url;
    var firstIndex = results.findIndex(function (el) {
        return (url === el.url);
    });
    return (firstIndex === index);
}
function _liveFilter(result, index, results) {
    if (result.type !== 'live')
        return false;
    // filter duplicates
    var videoId = result.videoId;
    var firstIndex = results.findIndex(function (el) {
        return (videoId === el.videoId);
    });
    return (firstIndex === index);
}
function _allFilter(result, index, results) {
    switch (result.type) {
        case 'video':
        case 'list':
        case 'channel':
        case 'live':
            break;
        default:
            // unsupported type
            return false;
    }
    // filter duplicates
    var url = result.url;
    var firstIndex = results.findIndex(function (el) {
        return (url === el.url);
    });
    return (firstIndex === index);
}
/* Request search page results with provided
 * search_query term
 */
function getSearchResults(_options, callback) {
    // querystring variables
    var q = _querystring.escape(_options.search).split(/\s+/);
    var hl = _options.hl || 'en';
    var gl = _options.gl || 'US';
    var category = _options.category || ''; // music
    var pageStart = (Number(_options.pageStart) || 1);
    var pageEnd = (Number(_options.pageEnd) ||
        Number(_options.pages) || 1);
    // handle zero-index start
    if (pageStart <= 0) {
        pageStart = 1;
        if (pageEnd >= 1) {
            pageEnd += 1;
        }
    }
    if (Number.isNaN(pageEnd)) {
        callback('error: pageEnd must be a number');
    }
    _options.pageStart = pageStart;
    _options.pageEnd = pageEnd;
    _options.currentPage = _options.currentPage || pageStart;
    var queryString = '?';
    queryString += 'search_query=' + q.join('+');
    // language
    // queryString += '&'
    if (queryString.indexOf('&hl=') === -1) {
        queryString += '&hl=' + hl;
    }
    // location
    // queryString += '&'
    if (queryString.indexOf('&gl=') === -1) {
        queryString += '&gl=' + gl;
    }
    if (category) { // ex. "music"
        queryString += '&category=' + category;
    }
    if (_options.sp) {
        queryString += '&sp=' + _options.sp;
    }
    var uri = TEMPLATES.SEARCH_DESKTOP + queryString;
    var params = _url.parse(uri);
    params.headers = {
        'user-agent': _userAgent,
        'accept': 'text/html',
        'accept-encoding': 'gzip',
        'accept-language': 'en-US'
    };
    debug();
    debug();
    _dasu.req(params, function (err, res, body) {
        if (err) {
            callback(err);
        }
        else {
            if (res.status !== 200) {
                return callback('http status: ' + res.status);
            }
            if (_debugging) {
                var fs = require('fs');
                var path = require('path');
                fs.writeFileSync('dasu.response', res.responseText, 'utf8');
            }
            try {
                _parseSearchResultInitialData(body, function (err, results) {
                    if (err)
                        return callback(err);
                    var list = results;
                    var videos = list.filter(_videoFilter);
                    var playlists = list.filter(_playlistFilter);
                    var channels = list.filter(_channelFilter);
                    var live = list.filter(_liveFilter);
                    var all = list.filter(_allFilter);
                    // keep saving results into temporary memory while
                    // we get more results
                    _options._data = _options._data || {};
                    // init memory
                    _options._data.videos = _options._data.videos || [];
                    _options._data.playlists = _options._data.playlists || [];
                    _options._data.channels = _options._data.channels || [];
                    _options._data.live = _options._data.live || [];
                    _options._data.all = _options._data.all || [];
                    // push received results into memory
                    videos.forEach(function (item) {
                        _options._data.videos.push(item);
                    });
                    playlists.forEach(function (item) {
                        _options._data.playlists.push(item);
                    });
                    channels.forEach(function (item) {
                        _options._data.channels.push(item);
                    });
                    live.forEach(function (item) {
                        _options._data.live.push(item);
                    });
                    all.forEach(function (item) {
                        _options._data.all.push(item);
                    });
                    _options.currentPage++;
                    var getMoreResults = (_options.currentPage <= _options.pageEnd);
                    if (getMoreResults && results._sp) {
                        _options.sp = results._sp;
                        setTimeout(function () {
                            getSearchResults(_options, callback);
                        }, 2500); // delay a bit to try and prevent throttling
                    }
                    else {
                        var videos_1 = _options._data.videos.filter(_videoFilter);
                        var playlists_1 = _options._data.playlists.filter(_playlistFilter);
                        var channels_1 = _options._data.channels.filter(_channelFilter);
                        var live_1 = _options._data.live.filter(_liveFilter);
                        var all_1 = _options._data.all.slice(_allFilter);
                        // return all found videos
                        callback(null, {
                            all: all_1,
                            videos: videos_1,
                            live: live_1,
                            playlists: playlists_1,
                            lists: playlists_1,
                            accounts: channels_1,
                            channels: channels_1
                        });
                    }
                });
            }
            catch (err) {
                callback(err);
            }
        }
    });
}
/* For "modern" user-agents the html document returned from
 * YouTube contains initial json data that is used to populate
 * the page with JavaScript. This function will aim to find and
 * parse such data.
 */
function _parseSearchResultInitialData(responseText, callback) {
    var re = /{.*}/;
    var $ = _cheerio.load(responseText);
    var initialData = $('div#initial-data').html() || '';
    initialData = re.exec(initialData) || '';
    if (!initialData) {
        var scripts = $('script');
        for (var i = 0; i < scripts.length; i++) {
            var script = $(scripts[i]).html();
            var lines = script.split('\n');
            lines.forEach(function (line) {
                var i;
                while ((i = line.indexOf('ytInitialData')) >= 0) {
                    line = line.slice(i + 'ytInitialData'.length);
                    var match = re.exec(line);
                    if (match && match.length > initialData.length) {
                        initialData = match;
                    }
                }
            });
        }
    }
    if (!initialData) {
        return callback('could not find inital data in the html document');
    }
    var errors = [];
    var results = [];
    var json = JSON.parse(initialData[0]);
    var items = _jp.query(json, '$..itemSectionRenderer..contents.*');
    // support newer richGridRenderer html structure
    _jp.query(json, '$..primaryContents..contents.*').forEach(function (item) {
        items.push(item);
    });
    debug();
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var result = undefined;
        var type = 'unknown';
        var hasList = (_jp.value(item, '$..compactPlaylistRenderer') ||
            _jp.value(item, '$..playlistRenderer'));
        var hasChannel = (_jp.value(item, '$..compactChannelRenderer') ||
            _jp.value(item, '$..channelRenderer'));
        var hasVideo = (_jp.value(item, '$..compactVideoRenderer') ||
            _jp.value(item, '$..videoRenderer'));
        var listId = hasList && (_jp.value(item, '$..playlistId'));
        var channelId = hasChannel && (_jp.value(item, '$..channelId'));
        var videoId = hasVideo && (_jp.value(item, '$..videoId'));
        var watchingLabel = (_jp.query(item, '$..viewCountText..text')).join('');
        var isUpcoming = (
            // if scheduled livestream (has not started yet)
            (_jp.query(item, '$..thumbnailOverlayTimeStatusRenderer..style').join('').toUpperCase().trim() === 'UPCOMING'));
        var isLive = (watchingLabel.indexOf('watching') >= 0 ||
            (_jp.query(item, '$..badges..label').join('').toUpperCase().trim() === 'LIVE NOW') ||
            (_jp.query(item, '$..thumbnailOverlayTimeStatusRenderer..text').join('').toUpperCase().trim() === 'LIVE') || isUpcoming);
        if (videoId) {
            type = 'video';
        }
        if (channelId) {
            type = 'channel';
        }
        if (listId) {
            type = 'list';
        }
        if (isLive) {
            type = 'live';
        }
        try {
            switch (type) {
                case 'video':
                    {
                        var thumbnail = (_normalizeThumbnail(_jp.value(item, '$..thumbnail..url')) ||
                            _normalizeThumbnail(_jp.value(item, '$..thumbnails..url')) ||
                            _normalizeThumbnail(_jp.value(item, '$..thumbnails')));
                        var title = (_jp.value(item, '$..title..text') ||
                            _jp.value(item, '$..title..simpleText'));
                        var author_name = (_jp.value(item, '$..shortBylineText..text') ||
                            _jp.value(item, '$..longBylineText..text'));
                        var author_url = (_jp.value(item, '$..shortBylineText..url') ||
                            _jp.value(item, '$..longBylineText..url'));
                        // publish/upload date
                        var agoText = (_jp.value(item, '$..publishedTimeText..text') ||
                            _jp.value(item, '$..publishedTimeText..simpleText'));
                        var lengthText = (_jp.value(item, '$..lengthText..text') ||
                            _jp.value(item, '$..lengthText..simpleText'));
                        var duration = _parseDuration(lengthText || '0:00');
                        var description = ((_jp.query(item, '$..description..text')).join('') ||
                            (_jp.query(item, '$..descriptionSnippet..text')).join(''));
                        // url ( playlist )
                        // const url = _jp.value( item, '$..navigationEndpoint..url' )
                        var url = TEMPLATES.YT + '/watch?v=' + videoId;
                        result = {
                            type: 'video',
                            id: videoId,
                            url: url,
                            title: title.trim(),
                            desc: description,
                            image: thumbnail,
                            thumbnail: thumbnail,
                            seconds: Number(duration.seconds),
                            timestamp: duration.timestamp,
                            duration: duration,
                            ago: agoText,
                            author: {
                                name: author_name,
                                url: TEMPLATES.YT + author_url,
                            }
                        };
                    }
                    break;
                case 'list':
                    {
                        var thumbnail = (_normalizeThumbnail(_jp.value(item, '$..thumbnail..url')) ||
                            _normalizeThumbnail(_jp.value(item, '$..thumbnails..url')) ||
                            _normalizeThumbnail(_jp.value(item, '$..thumbnails')));
                        var title = (_jp.value(item, '$..title..text') ||
                            _jp.value(item, '$..title..simpleText'));
                        var author_name = (_jp.value(item, '$..shortBylineText..text') ||
                            _jp.value(item, '$..longBylineText..text') ||
                            _jp.value(item, '$..shortBylineText..simpleText') ||
                            _jp.value(item, '$..longBylineText..simpleTextn')) || 'YouTube';
                        var author_url = (_jp.value(item, '$..shortBylineText..url') ||
                            _jp.value(item, '$..longBylineText..url')) || '';
                        var video_count = (_jp.value(item, '$..videoCountShortText..text') ||
                            _jp.value(item, '$..videoCountText..text') ||
                            _jp.value(item, '$..videoCountShortText..simpleText') ||
                            _jp.value(item, '$..videoCountText..simpleText') ||
                            _jp.value(item, '$..thumbnailText..text') ||
                            _jp.value(item, '$..thumbnailText..simpleText'));
                        // url ( playlist )
                        // const url = _jp.value( item, '$..navigationEndpoint..url' )
                        var url = TEMPLATES.YT + '/playlist?list=' + listId;
                        result = {
                            type: 'list',
                            id: listId,
                            url: url,
                            title: title.trim(),
                            image: thumbnail,
                            thumbnail: thumbnail,
                            videoCount: video_count,
                            author: {
                                name: author_name,
                                url: TEMPLATES.YT + author_url,
                            }
                        };
                    }
                    break;
                case 'channel':
                    {
                        var thumbnail = (_normalizeThumbnail(_jp.value(item, '$..thumbnail..url')) ||
                            _normalizeThumbnail(_jp.value(item, '$..thumbnails..url')) ||
                            _normalizeThumbnail(_jp.value(item, '$..thumbnails')));
                        var title = (_jp.value(item, '$..title..text') ||
                            _jp.value(item, '$..title..simpleText') ||
                            _jp.value(item, '$..displayName..text'));
                        var author_name = (_jp.value(item, '$..shortBylineText..text') ||
                            _jp.value(item, '$..longBylineText..text') ||
                            _jp.value(item, '$..displayName..text') ||
                            _jp.value(item, '$..displayName..simpleText'));
                        var video_count_label = (_jp.value(item, '$..videoCountText..text') ||
                            _jp.value(item, '$..videoCountText..simpleText') || '0');
                        // url ( playlist )
                        // const url = _jp.value( item, '$..navigationEndpoint..url' )
                        //@ts-ignore
                        var url = (_jp.value(item, '$..navigationEndpoint..url') ||
                            '/user/' + title)! as any;
                        result = {
                            type: 'channel',
                            name: author_name,
                            url: TEMPLATES.YT + url,
                            title: title.trim(),
                            image: thumbnail,
                            thumbnail: thumbnail,
                            videoCount: Number(video_count_label.replace(/\D+/g, '')),
                            videoCountLabel: video_count_label
                        };
                    }
                    break;
                case 'live':
                    {
                        var thumbnail = (_normalizeThumbnail(_jp.value(item, '$..thumbnail..url')) ||
                            _normalizeThumbnail(_jp.value(item, '$..thumbnails..url')) ||
                            _normalizeThumbnail(_jp.value(item, '$..thumbnails')));
                        var title = (_jp.value(item, '$..title..text') ||
                            _jp.value(item, '$..title..simpleText'));
                        var author_name = (_jp.value(item, '$..shortBylineText..text') ||
                            _jp.value(item, '$..longBylineText..text'));
                        var author_url = (_jp.value(item, '$..shortBylineText..url') ||
                            _jp.value(item, '$..longBylineText..url'));
                        var watchingLabel_1 = ((_jp.query(item, '$..viewCountText..text')).join('') ||
                            (_jp.query(item, '$..viewCountText..simpleText')).join('') || '0');
                        var description = ((_jp.query(item, '$..description..text')).join('') ||
                            (_jp.query(item, '$..descriptionSnippet..text')).join(''));
                        var scheduledEpochTime = (_jp.value(item, '$..upcomingEventData..startTime'));
                        var scheduledTime = ((Date.now() > scheduledEpochTime) ? scheduledEpochTime * 1000 : scheduledEpochTime);
                        var scheduledDateString = _toInternalDateString(scheduledTime);
                        // url ( playlist )
                        // const url = _jp.value( item, '$..navigationEndpoint..url' )
                        var url = TEMPLATES.YT + '/watch?v=' + videoId;
                        result = {
                            type: 'live',
                            id: videoId,
                            url: url,
                            title: title.trim(),
                            description: description,
                            image: thumbnail,
                            thumbnail: thumbnail,
                            author: {
                                name: author_name,
                                url: TEMPLATES.YT + author_url,
                            }
                        };
                        if (scheduledTime) {
                            result.startTime = scheduledTime;
                            result.startDate = scheduledDateString;
                            result.status = 'UPCOMING';
                        }
                        else {
                            result.status = 'LIVE';
                        }
                    }
                    break;
                default:
                // ignore other stuff
            }
            if (result) {
                results.push(result);
            }
        }
        catch (err) {
            debug();
            errors.push(err);
        }
    }
    var ctoken = _jp.value(json, '$..continuation');
    results._ctoken = ctoken;
    if (errors.length) {
        return callback(errors.pop(), results);
    }
    return callback(null, results);
}
/* Get metadata of a single video
 */
function getVideoMetaData(opts, callback) {
    debug();
    var videoId;
    if (typeof opts === 'string') {
        videoId = opts;
    }
    if (typeof opts === 'object') {
        videoId = opts.videoId;
    }
    var uri = 'https://www.youtube.com/watch?hl=en&gl=US&v=' + videoId;
    var params = _url.parse(uri);
    params.headers = {
        'user-agent': _userAgent,
        'accept': 'text/html',
        'accept-encoding': 'gzip',
        'accept-language': 'en-US'
    };
    params.headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15';
    _dasu.req(params, function (err, res, body) {
        if (err) {
            callback(err);
        }
        else {
            if (res.status !== 200) {
                return callback('http status: ' + res.status);
            }
            if (_debugging) {
                var fs = require('fs');
                var path = require('path');
                fs.writeFileSync('dasu.response', res.responseText, 'utf8');
            }
            try {
                _parseVideoInitialData(body, callback);
            }
            catch (err) {
                callback(err);
            }
        }
    });
}
function _parseVideoInitialData(responseText, callback) {
    debug();
    // const fs = require( 'fs' )
    // fs.writeFileSync( 'tmp.file', responseText )
    responseText = _getScripts(responseText);
    var initialData = _between(_findLine(/ytInitialData.*=\s*{/, responseText), '{', '}');
    if (!initialData) {
        return callback('could not find inital data in the html document');
    }
    var initialPlayerData = _between(_findLine(/ytInitialPlayerResponse.*=\s*{/, responseText), '{', '}');
    if (!initialPlayerData) {
        return callback('could not find inital player data in the html document');
    }
    // debug( initialData[ 0 ] )
    // debug( '\n------------------\n' )
    // debug( initialPlayerData[ 0 ] )
    var idata = JSON.parse(initialData);
    var ipdata = JSON.parse(initialPlayerData);
    var videoId = _jp.value(idata, '$..currentVideoEndpoint..videoId');
    if (!videoId) {
        return callback('video unavailable');
    }
    if (_jp.value(ipdata, '$..status') === 'ERROR' ||
        _jp.value(ipdata, '$..reason') === 'Video unavailable') {
        return callback('video unavailable');
    }
    var title = (_jp.value(idata, '$..videoPrimaryInfoRenderer..title..text') ||
        _jp.value(idata, '$..videoPrimaryInfoRenderer..title..simpleText') ||
        _jp.value(idata, '$..videoPrimaryRenderer..title..text') ||
        _jp.value(idata, '$..videoPrimaryRenderer..title..simpleText') ||
        _jp.value(idata, '$..title..text') ||
        _jp.value(idata, '$..title..simpleText'));
    var description = ((_jp.query(idata, '$..description..text')).join('') ||
        (_jp.query(ipdata, '$..description..simpleText')).join('') ||
        (_jp.query(ipdata, '$..microformat..description..simpleText')).join('') ||
        (_jp.query(ipdata, '$..videoDetails..shortDescription')).join(''));
    var author_name = (_jp.value(idata, '$..owner..title..text') ||
        _jp.value(idata, '$..owner..title..simpleText'));
    var author_url = (_jp.value(idata, '$..owner..navigationEndpoint..url') ||
        _jp.value(idata, '$..owner..title..url'));
    var thumbnailUrl = 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
    var seconds = Number(_jp.value(ipdata, '$..videoDetails..lengthSeconds'));
    var timestamp = _msToTimestamp(seconds * 1000);
    var duration = _parseDuration(timestamp);
    var sentimentBar = (
        // ex. "tooltip": "116,701 / 8,930"
        _jp.value(idata, '$..sentimentBar..tooltip')
            .split(/[,.]/).join('')
            .split(/\D+/));
    var likes = Number(sentimentBar[0]);
    var dislikes = Number(sentimentBar[1]);
    var uploadDate = (_jp.value(idata, '$..uploadDate') ||
        _jp.value(idata, '$..dateText..simpleText'));
    var agoText = uploadDate && _humanTime(new Date(uploadDate)) || '';
    var video = {
        title: title,
        description: description,
        url: TEMPLATES.YT + '/watch?v=' + videoId,
        videoId: videoId,
        seconds: Number(duration.seconds),
        timestamp: duration.timestamp,
        duration: duration,
        genre: (_jp.value(ipdata, '$..category') || '').toLowerCase(),
        uploadDate: _toInternalDateString(uploadDate),
        ago: agoText,
        image: thumbnailUrl,
        thumbnail: thumbnailUrl,
        author: {
            name: author_name,
            url: TEMPLATES.YT + author_url
        }
    };
    callback(null, video);
}
/* Get metadata from a playlist page
 */
function getPlaylistMetaData(opts, callback) {
    debug();
    var listId;
    if (typeof opts === 'string') {
        listId = opts;
    }
    if (typeof opts === 'object') {
        listId = opts.listId || opts.playlistId;
    }
    var uri = ('https://www.youtube.com/playlist?hl=en&gl=US&list=' + listId);
    var params = _url.parse(uri);
    params.headers = {
        'user-agent': _userAgent,
        'accept': 'text/html',
        'accept-encoding': 'gzip',
        'accept-language': 'en-US'
    };
    _dasu.req(params, function (err, res, body) {
        if (err) {
            callback(err);
        }
        else {
            if (res.status !== 200) {
                return callback('http status: ' + res.status);
            }
            if (_debugging) {
                var fs = require('fs');
                var path = require('path');
                fs.writeFileSync('dasu.response', res.responseText, 'utf8');
            }
            try {
                _parsePlaylistInitialData(body, callback);
            }
            catch (err) {
                callback(err);
            }
        }
    });
}
function _parsePlaylistInitialData(responseText, callback) {
    debug();
    responseText = _getScripts(responseText);
    var jsonString = responseText.match(/ytInitialData.*=\s*({.*});/)[1];
    // console.log( jsonString )
    if (!jsonString) {
        throw new Error('failed to parse ytInitialData json data');
    }
    var json = JSON.parse(jsonString);
    //console.log( json )
    // check for errors (ex: noexist/unviewable playlist)
    var plerr = _jp.value(json, '$..alerts..alertRenderer');
    if (plerr && (typeof plerr.type === 'string') && plerr.type.toLowerCase() === 'error') {
        var plerrtext = 'playlist error, not found?';
        if (typeof plerr.text === 'object') {
            plerrtext = _jp.query(plerr.text, '$..text').join('');
        }
        if (typeof plerr.text === 'string') {
            plerrtext = plerr.text;
        }
        throw new Error('playlist error: ' + plerrtext);
    }
    var listId = (_jp.value(json, '$..microformat..urlCanonical')).split('=')[1];
    // console.log( 'listId: ' + listId )
    var viewCount = 0;
    try {
        var viewCountLabel = _jp.value(json, '$..sidebar.playlistSidebarRenderer.items[0]..stats[1].simpleText');
        if (viewCountLabel.toLowerCase() === 'no views') {
            viewCount = 0;
        }
        else {
            viewCount = viewCountLabel.match(/\d+/g).join('');
        }
    }
    catch (err) { /* ignore */ }
    var size = (_jp.value(json, '$..sidebar.playlistSidebarRenderer.items[0]..stats[0].simpleText') ||
        _jp.query(json, '$..sidebar.playlistSidebarRenderer.items[0]..stats[0]..text').join('')).match(/\d+/g).join('');
    // playlistVideoListRenderer contents
    var list = _jp.query(json, '$..playlistVideoListRenderer..contents')[0];
    // TODO unused atm
    var listHasContinuation = (typeof list[list.length - 1].continuationItemRenderer === 'object');
    // const list = _jp.query( json, '$..contents..tabs[0]..contents[0]..contents[0]..contents' )[ 0 ]
    var videos = [];
    list.forEach(function (item) {
        if (!item.playlistVideoRenderer)
            return; // skip
        var json = item;
        var duration = (_parseDuration(_jp.value(json, '$..lengthText..simpleText') ||
            _jp.value(json, '$..thumbnailOverlayTimeStatusRenderer..simpleText') ||
            (_jp.query(json, '$..lengthText..text')).join('') ||
            (_jp.query(json, '$..thumbnailOverlayTimeStatusRenderer..text')).join('')));
        var video = {
            title: (_jp.value(json, '$..title..simpleText') ||
                _jp.value(json, '$..title..text') ||
                (_jp.query(json, '$..title..text')).join('')),
            videoId: _jp.value(json, '$..videoId'),
            listId: listId,
            thumbnail: (_normalizeThumbnail(_jp.value(json, '$..thumbnail..url')) ||
                _normalizeThumbnail(_jp.value(json, '$..thumbnails..url')) ||
                _normalizeThumbnail(_jp.value(json, '$..thumbnails'))),
            // ref: issue #35 https://github.com/talmobi/yt-search/issues/35
            duration: duration,
            author: {
                name: _jp.value(json, '$..shortBylineText..runs[0]..text'),
                url: 'https://youtube.com' + _jp.value(json, '$..shortBylineText..runs[0]..url'),
            }
        };
        videos.push(video);
    });
    // console.log( videos )
    // console.log( 'videos.length: ' + videos.length )
    var plthumbnail = (_normalizeThumbnail(_jp.value(json, '$..microformat..thumbnail..url')) ||
        _normalizeThumbnail(_jp.value(json, '$..microformat..thumbnails..url')) ||
        _normalizeThumbnail(_jp.value(json, '$..microformat..thumbnails')));
    var playlist = {
        title: _jp.value(json, '$..microformat..title'),
        listId: listId,
        url: 'https://youtube.com/playlist?list=' + listId,
        size: Number(size),
        views: Number(viewCount),
        // lastUpdate: lastUpdate,
        date: _parsePlaylistLastUpdateTime((_jp.value(json, '$..sidebar.playlistSidebarRenderer.items[0]..stats[2]..simpleText')) ||
            (_jp.query(json, '$..sidebar.playlistSidebarRenderer.items[0]..stats[2]..text')).join('') ||
            ''),
        image: plthumbnail || videos[0].thumbnail,
        thumbnail: plthumbnail || videos[0].thumbnail,
        // playlist items/videos
        videos: videos,
        author: {
            name: _jp.value(json, '$..videoOwner..title..runs[0]..text'),
            url: 'https://youtube.com' + _jp.value(json, '$..videoOwner..navigationEndpoint..url')
        }
    };
    callback && callback(null, playlist);
}
function _parsePlaylistLastUpdateTime(lastUpdateLabel) {
    debug();
    var DAY_IN_MS = (1000 * 60 * 60 * 24);
    try {
        // ex "Last Updated on Jun 25, 2018"
        // ex: "Viimeksi päivitetty 25.6.2018"
        var words = lastUpdateLabel.toLowerCase().trim().split(/[\s.-]+/);
        if (words.length > 0) {
            var lastWord = (words[words.length - 1]).toLowerCase();
            if (lastWord === 'yesterday') {
                var ms = Date.now() - DAY_IN_MS;
                var d = new Date(ms); // a day earlier than today
                if (d.toString() !== 'Invalid Date')
                    return _toInternalDateString(d);
            }
        }
        if (words.length >= 2) {
            // handle strings like "7 days ago"
            if (words[0] === 'updated' && words[2].slice(0, 3) === 'day') {
                var ms = Date.now() - (DAY_IN_MS * words[1]);
                var d = new Date(ms); // a day earlier than today
                if (d.toString() !== 'Invalid Date')
                    return _toInternalDateString(d);
            }
        }
        for (var i = 0; i < words.length; i++) {
            var slice = words.slice(i);
            var t = slice.join(' ');
            var r = slice.reverse().join(' ');
            var a = new Date(t);
            var b = new Date(r);
            if (a.toString() !== 'Invalid Date')
                return _toInternalDateString(a);
            if (b.toString() !== 'Invalid Date')
                return _toInternalDateString(b);
        }
        return '';
    }
    catch (err) {
        return '';
    }
}
function _toInternalDateString(date) {
    date = new Date(date);
    debug();
    return (date.getFullYear() + '-' +
        (date.getMonth() + 1) + '-' + // january gives 0
        date.getDate());
}
/* Helper fn to parse duration labels
 * ex: Duration: 2:27, Kesto: 1.07.54
 */
function _parseDuration(timestampText) {
    var a = timestampText.split(/\s+/);
    var lastword = a[a.length - 1];
    // ex: Duration: 2:27, Kesto: 1.07.54
    // replace all non :, non digits and non .
    var timestamp = lastword.replace(/[^:.\d]/g, '');
    if (!timestamp)
        return {
            toString: function () { return a[0]; },
            seconds: 0,
            timestamp: 0
        };
    // remove trailing junk that are not digits
    while (timestamp[timestamp.length - 1].match(/\D/)) {
        timestamp = timestamp.slice(0, -1);
    }
    // replaces all dots with nice ':'
    timestamp = timestamp.replace(/\./g, ':');
    var t = timestamp.split(/[:.]/);
    var seconds = 0;
    var exp = 0;
    for (var i = t.length - 1; i >= 0; i--) {
        if (t[i].length <= 0)
            continue;
        var number = t[i].replace(/\D/g, '');
        // var exp = (t.length - 1) - i;
        seconds += parseInt(number) * (exp > 0 ? Math.pow(60, exp) : 1);
        exp++;
        if (exp > 2)
            break;
    }
    ;
    return {
        toString: function () { return seconds + ' seconds (' + timestamp + ')'; },
        seconds: seconds,
        timestamp: timestamp
    };
}
/* Parses a type of human-like timestamps found on YouTube.
 * ex: "PT4M13S" -> "4:13"
 */
// @ts-ignore
function _parseHumanDuration(timestampText) {
    debug();
    // ex: PT4M13S
    var pt = timestampText.slice(0, 2);
    var timestamp = timestampText.slice(2).toUpperCase();
    if (pt !== 'PT')
        return {
            //@ts-ignore
            toString: function () { return a[0]; },
            seconds: 0,
            timestamp: 0
        };
    var h = timestamp.match(/\d?\dH/);
    var m = timestamp.match(/\d?\dM/);
    var s = timestamp.match(/\d?\dS/);
    h = h && h[0].slice(0, -1) || 0;
    m = m && m[0].slice(0, -1) || 0;
    s = s && s[0].slice(0, -1) || 0;
    h = parseInt(h);
    m = parseInt(m);
    s = parseInt(s);
    timestamp = '';
    if (h)
        timestamp += (h + ':');
    if (m)
        timestamp += (m + ':');
    timestamp += s;
    var seconds = (h * 60 * 60 + m * 60 + s);
    return {
        toString: function () { return seconds + ' seconds (' + timestamp + ')'; },
        seconds: seconds,
        timestamp: timestamp
    };
}
/* Helper fn to parse sub count labels
 * and turn them into Numbers.
 *
 * It's an estimate but can be useful for sorting etc.
 *
 * ex. "102M subscribers" -> 102000000
 * ex. "5.33m subscribers" -> 5330000
 */
// @ts-ignore
function _parseSubCountLabel(subCountLabel) {
    if (!subCountLabel)
        return undefined;
    var label = (subCountLabel.split(/\s+/)
        .filter(function (w) { return w.match(/\d/); }))[0].toLowerCase();
    var m = label.match(/\d+(\.\d+)?/);
    if (m && m[0]) { }
    else {
        return;
    }
    var num = Number(m[0]);
    var THOUSAND = 1000;
    var MILLION = THOUSAND * THOUSAND;
    if (label.indexOf('m') >= 0)
        return MILLION * num;
    if (label.indexOf('k') >= 0)
        return THOUSAND * num;
    return num;
}
/* Helper fn to choose a good thumbnail.
 */
// @ts-ignore
function _normalizeThumbnail(thumbnails) {
    var t;
    if (typeof thumbnails === 'string') {
        t = thumbnails;
    }
    else {
        // handle as array
        if (thumbnails.length) {
            t = thumbnails[0];
            return _normalizeThumbnail(t);
        }
        // failed to parse thumbnail
        return undefined;
    }
    t = t.split('?')[0];
    t = t.split('/default.jpg').join('/hqdefault.jpg');
    t = t.split('/default.jpeg').join('/hqdefault.jpeg');
    if (t.indexOf('//') === 0) {
        return 'https://' + t.slice(2);
    }
    return t.split('http://').join('https://');
}
/* Helper fn to transform ms to timestamp
 * ex: 253000 -> "4:13"
 */
function _msToTimestamp(ms) {
    var t = '';
    var MS_HOUR = 1000 * 60 * 60;
    var MS_MINUTE = 1000 * 60;
    var MS_SECOND = 1000;
    var h = Math.floor(ms / MS_HOUR);
    var m = Math.floor(ms / MS_MINUTE) % 60;
    var s = Math.floor(ms / MS_SECOND) % 60;
    if (h)
        t += h + ':';
    if (m)
        t += m + ':';
    if (String(s).length < 2)
        t += '0';
    t += s;
    return t;
}
