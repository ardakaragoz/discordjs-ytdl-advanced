<!DOCTYPE html>
<html>
<head>
  
<style>
  
table {
  font-family: arial, sans-serif;
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: #dddddd;
}

</style>

</head>

<body>

# discordjs-ytdl-advanced

**Better version of [discordjs-ytdl](https://npmjs.com/package/discordjs-ytdl). No API Key needed, more suitable results. Shortly, Discord Youtube Searcher.**

## Purpose Of This Module

<code>This is better version of discordjs-ytdl NPM module. I take so many pull request about this so I want to make new updated module for making better youtube search module.</code>

<hr>

### Difference between Discordjs-Ytdl and Discordjs-Ytdl-Advanced

<table>
<tr>
<th>Differences</th>
<th>Discordjs-Ytdl</th>
<th>Discordjs-Ytdl-Advanced</th>
</tr>
<tr>
<th>API KEY</th>
<th>Need API KEY at Google Developers</th>
<th>No API KEY needed.</th>
</tr>
<tr>
<th>USAGE</th>
<th>Needed async await in each function</th>
<th>Needed async await only first function</th>
</tr>
<tr>
<th>Problems</th>
<th>Common thing</th>
<th>Problems are rarer.</th>
</tr>
<tr>
<th>Time To Start</th>
<th>Waits 3-4 seconds before sounding and 5-6 seconds before infos.</th>
<th>Almost do every operations in 2-3 seconds.</th>
</tr>
<tr>
<th>Language Support</th>
<th>JavaScript&TypeScript(Less)</th>
<th>JavaScript&TypeScript(Fully)</th>
</tr>
<tr>
<th>License</th>
<th>MIT</th>
<th>MIT</th>
</tr>
</table>
<br>
<hr>

> Rhino Inc. is a small company that was created by Arda Karagöz. Rhino Inc. contains Coding programs, Code Projects, Discord Bots etc. Rhino Inc. has small enviroment to know but its knowledge by others will be increase in next months.

> Arda Karagöz is a 15 year old Half Developer. I am from Turkey and I want to be a software engineer. I know a lot about JavaScript and Python and also I know C#, C++, Java, HTML and CSS. I am the founder of Rhino Inc. I created lots of projects but the bests are: Rhino Bot(About 800K Users 900 Guilds - The Most Useful Turkish Bot), rhino-api(This Module. Helps you in math problems and daily fun codes), MasterG Bot(A Great Private Discord Bot For Our Server), Mental Power Discord Bot Tutorial(It will go more than +40 Eps), Github Markdown Repo(Will be published in few weeks.) and more...

Tutorial video = [It's Turkish But You Can Watch](https://www.youtube.com/watch?v=MRUUQkdsylU&list=PLHr_rlW-p5kaPSrBHHl0F958NZBj7eO6k&index=31)
<br>

### Topics
* [Create Variable](#create-variable)
* [A Simple Discord Bot](#a-simple-discord-bot)
* [Playing Music](#playing-music)
* [Getting Infos](#getting-infos)
* [Playlist Infos](#playlist-infos)
* [StreamDispatcher](#streamdispatcher)
* [Spotify!?](#do-you-know-you-can-also-play-spotify-songs!?)

### Create Variable

For Creating Variable You Can Do This
```js
const player = require('discordjs-ytdl-advanced')
```

### A Simple Discord Bot

If You DON'T Know How to Make a Bot Click [This](https://www.youtube.com/watch?v=4w8Su0dRFAw)

For Example You Can Make A Music Command Like This:

```js
const Discord = require('discord.js') // discord.js modülü tanımlıyoruz.
const client = new Discord.Client() // client tanımalamsı

client.login('TOKEN')

client.on('message', async message => {
    // Voice only works in guilds, if the message does not come from a guild,
    // we ignore it
try {
    if (!message.guild) return;

    if (message.content.startsWith('/play')) {
        // Only try to join the sender's voice channel if they are in one themselves
        if (message.member.voice.channel) {
            const connection = await message.member.voice.channel.join();
            const args = message.content.split(' ').slice(1)
            const ytdl = require('ytdl-core')
            connection.play(ytdl(args.join(" ")))
        } else {
            message.reply('You need to join a voice channel first!');
        }
    }
} catch(e){
console.log(e)
}
});
```

**But You Can Only Enter URL**

### Playing Music

*Simply, methods work like this:*

```js
const SONG = await player("Search_Parameter")
SONG.play(connection) //PLAYS SONG
message.channel.send(SONG.title) //Outputs Song Title
console.log(SONG.data) //Writes all Infos
```

### Getting Infos

*There are several object data infos. Let's see them.*

```js
{
  title: String, //Title Of Video
  id: String, //Video ID
  url: String, //Video URL
  description: String, //Video Description
  thumbnail: String, //Video Thumbnail
  data: Object, //All These Datas in JSON
  seconds: Number, //Video's Length in seconds
  time: String; //Video Time in minute seconds
  date: String; //Video date to now
  channel: String; //Channel name
  channelURL: String; //Channel URL
}
```

<br>

How can we use them? Well, it is easy.

```js
const SONG = await player("Mental Power Discord")
console.log(SONG.title) //Discord Bot Dersleri #1 | Bot oluşturma, Mesaj gönderme
console.log(SONG.channel) //Mental Power
```

...and more

### Playlist Infos

*There is no way to play all songs with only discordjs-ytdl-advanced, but you can get all statics in a playlist. You can take all videos in playlist as an array or take default infos of playlist, whatever you want!*

```js
const PLAYLIST = await player.playlist("Discord Bot Dersleri")
console.log(PLAYLIST.title) //Discord Bot Dersleri
console.log(PLAYLIST.listId) //ID
```

*You can also get songs in playlist*

```js
const PLAYLIST = await player.playlistsongs("Discord Bot Dersleri")
console.log(PLAYLIST[0].title) //Discord Bot Dersleri #1
console.log(PLAYLIST[0].url) //URL
```

### StreamDispatcher

[StreamDispatcher](https://discord.js.org/#/docs/main/stable/class/StreamDispatcher) is the voice actions after start to play either connection song or mp3 files. And you can easily work same StreamDispatcher as you had been doing before.

```js
const SONG = await player("Discord Bot Dersleri #1")
const song = await SONG.play(connection)
//Now You Can Do Same Methods As StreamDispatcher
song.pause()
song.resume()
song.on('finish', () => {
  //TODO
}) 
```

### Do You Know You Can Also Play Spotify Songs!?

**I know, it's so crazy! But you can also play spotify songs by url. Let's do some examples.**

```js
const SONG = await player("https://open.spotify.com/track/0nJW01T7XtvILxQgC5J7Wh?si=194ecd3955b14d74")
const song = await SONG.play(connection)
//DO SOME EMBEDS
```

RESULT:

![](spotifysong.png)

### END

*Thanks for reviewing my first* **really big** *project. I hope it will be useful.* 

CONTACT: [Mail](mailto:ahmetarda2006@hotmail.com.tr)

</body>
</html>
