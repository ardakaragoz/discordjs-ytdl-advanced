const searchs = require("../search/index")
async function getSongSync(query:string) : Promise<object> {
    try {
    let result = await searchs(query)
    if (result.all[0].type === "live") return result.live[0]
    return result.all.filter((x: { type: string; }) => x.type === 'video')[0];
    } catch(e){
        throw new ReferenceError("An Error Was Occured. No Song Result.")
    }
}

async function getPlaylist(query:string) : Promise<object> {
    try {
    let result = await searchs(query)
    let song = (result.all.filter((x: { type: string; }) => x.type === 'list'))[0]
    return await searchs({ listId: song.id })
    } catch (e) {
        throw new ReferenceError("An Error Was Occured. No Song Result.")
    }
}

async function getPlaylistSongs(query:string) : Promise<object> {
    try {
    let result = await searchs(query)
    let playlist = result.all.filter((x: { type: string; }) => x.type === 'list')[0]
    let getplaylist = await searchs({listId: playlist.id})
    return getplaylist.videos
    } catch (e) {
        throw new ReferenceError("An Error Was Occured. No Song Result.")
    }
}

async function get10Song(query2:string) {
    try {
    let result = await searchs(query2)
    return (result.videos.slice(0, 9))
    } catch (e) {
        throw new ReferenceError("An Error Was Occured. No Song Result.")
    }
}

module.exports.getSongSync = getSongSync
module.exports.getPlaylist = getPlaylist
module.exports.getPlaylistSongs = getPlaylistSongs
module.exports.get10Song = get10Song