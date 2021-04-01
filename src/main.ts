const search = require('./song')
import ytdl = require('ytdl-core')
import {StreamDispatcher, VoiceConnection} from 'discord.js'
type StreamOptions = {
    filter: string,
    volume: number
}
let StreamOptions = {
    filter: 'audioonly', volume: 0.5
}

class MAIN {
    title: string
    id: string
    url: string
    description: string
    thumbnail: string
    data: object
    seconds: number
    time: string
    date: string
    channel: string
    channelURL: string
    constructor(searchPARAM:any){
        type searchPARAM = {
            title: string,
            id: string,
            url: string
            description: string
            thumbnail: string
            data: object
            seconds: number
            time: string
            date: string
            channel: string
            channelURL: string
        }
        this.title = searchPARAM["title"]
        this.id = searchPARAM.id 
        this.url = searchPARAM.url
        this.description = searchPARAM.desc
        this.thumbnail = searchPARAM.thumbnail
        this.data = searchPARAM
        this.seconds = searchPARAM.seconds
        this.time = searchPARAM.timestamp
        this.date = searchPARAM.ago
        this.channel = searchPARAM.author.name
        this.channelURL = searchPARAM.author.url
    }

    async play(connection:VoiceConnection) : Promise<StreamDispatcher>{
        let y = await connection.play(ytdl(this.url), StreamOptions)
        return y;
    }
}

async function main(params: string): Promise<any> {
    let a = await search.getSongSync(params)
    return new MAIN(a)
}

async function playlist(playlist: string): Promise<any> {
    let a = await search.getPlaylist(playlist)
    return a
}

async function playlistsongs(playlist: string): Promise<any> {
    let a = await search.getPlaylistSongs(playlist)
    return a
}

module.exports.playlist = playlist
module.exports.playlist_songs = playlistsongs
module.exports.MusicPlayer = main