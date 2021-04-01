var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var searchs = require("../search/index");
function getSongSync(query) {
    return __awaiter(this, void 0, void 0, function () {
        var result, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, searchs(query)];
                case 1:
                    result = _a.sent();
                    if (result.all[0].type === "live")
                        return [2 /*return*/, result.live[0]];
                    return [2 /*return*/, result.all.filter(function (x) { return x.type === 'video'; })[0]];
                case 2:
                    e_1 = _a.sent();
                    throw new ReferenceError("An Error Was Occured. No Song Result.");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getPlaylist(query) {
    return __awaiter(this, void 0, void 0, function () {
        var result, song, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, searchs(query)];
                case 1:
                    result = _a.sent();
                    song = (result.all.filter(function (x) { return x.type === 'list'; }))[0];
                    return [4 /*yield*/, searchs({ listId: song.id })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    e_2 = _a.sent();
                    throw new ReferenceError("An Error Was Occured. No Song Result.");
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getPlaylistSongs(query) {
    return __awaiter(this, void 0, void 0, function () {
        var result, playlist, getplaylist, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, searchs(query)];
                case 1:
                    result = _a.sent();
                    playlist = result.all.filter(function (x) { return x.type === 'list'; })[0];
                    return [4 /*yield*/, searchs({ listId: playlist.id })];
                case 2:
                    getplaylist = _a.sent();
                    return [2 /*return*/, getplaylist.videos];
                case 3:
                    e_3 = _a.sent();
                    throw new ReferenceError("An Error Was Occured. No Song Result.");
                case 4: return [2 /*return*/];
            }
        });
    });
}
function get10Song(query2) {
    return __awaiter(this, void 0, void 0, function () {
        var result, e_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, searchs(query2)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, (result.videos.slice(0, 9))];
                case 2:
                    e_4 = _a.sent();
                    throw new ReferenceError("An Error Was Occured. No Song Result.");
                case 3: return [2 /*return*/];
            }
        });
    });
}
module.exports.getSongSync = getSongSync;
module.exports.getPlaylist = getPlaylist;
module.exports.getPlaylistSongs = getPlaylistSongs;
module.exports.get10Song = get10Song;
