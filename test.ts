const Discord = require('discord.js')
const client = new Discord.Client()
const player = require("./main.js") //discordjs-ytdl-advanced
client.login("TOKEN")

client.on('message', async message => {
    if (message.content.startsWith("?play")) {
        try {
        const args = message.content.split(' ').slice(1)
        const connection = await message.member.voice.channel.join()
        let SONG = await player(args.join(" "))
        const song = await SONG.play(connection)
        const embed = new Discord.MessageEmbed()
            .setTitle("New Song " + SONG.title)
            .setThumbnail(SONG.thumbnail)
            .setColor("GREEN")
            .setDescription(`Video:\n\n**[${SONG.title}](${SONG.url})**\n\nVideo Açıklaması:\n\n**${SONG.description}**\n\nVideo Süresi:\n\n**${SONG.time}**\n\nKanal:\n\n[${SONG.channel}](${SONG.channelURL})`)
        message.channel.send(embed)
        song.on("finish", () => {
            message.member.voice.channel.leave()
        })
        } catch (e) {
            message.channel.send('ERROR')
        }
    }
})

async function x() {
    console.log(await require('./main').playlistsongs("Discord Bot Dersleri"))
    console.log(await require('./main').playlist("Discord Bot Dersleri"))
}

x()