const search = require('./execute')
var spotify = require('spotify-url-info')
/**
 * @param {String} query - Get Song
 */
module.exports = async (query: string | object): Promise<object> => {
    try {
        let result = await spotify.getPreview(query)
            const r = await search(result.title + ' - ' + result.artist)
            return r
    } catch(err) {       
            return await search(query)
        }
}