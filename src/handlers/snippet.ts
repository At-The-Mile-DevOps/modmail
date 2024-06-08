import {EmbedBuilder, Message} from "discord.js";
import ModMailPrisma from "../api/ModMail";
import settings from "../settings.json"

export default async function snippetFlow(message: Message) {
    const args = message.content.split(" ")[1]
    switch (args) {
        case "new": {
            const name = message.content.split(" ")[2]
            let val = message.content.split(" ").slice(3).join(" ")
            const status = await ModMailPrisma.POST.addNewSnippet(name, val)
            if (status === false) return message.reply({ content: "A snippet with that name already exists. Please use the edit command if you want to change the value." })

            let additionalDesc = ""
            let userSubMatches = val.match(/{u}/g)
            if (userSubMatches) {
                additionalDesc += `This snippet has **${userSubMatches.length}** user mention substitutions.\n`
                val = val.replace("{u}", `<@${settings.CLIENT_ID}>`)
            }

            let authorSubMatches = val.match(/{a}/g)
            if (authorSubMatches) {
                additionalDesc += `This snipppt has **${authorSubMatches.length}** author mention substitutions.\n`
                val = val.replace("{a}", `<@${message.author.id}>`)
            }

            let reasonSubMatches = val.match(/{r}/g)
            if (reasonSubMatches) {
                additionalDesc += `This snippet has **${reasonSubMatches.length}** reason substitutions.\n`
                val = val.replace("{r}", `This is a sample reason.`)
            }

            additionalDesc += "\n\n"
            const embed = new EmbedBuilder()
                .setTitle(`New Snippet Created - ${settings.prefix}${name}`)
                .setColor(0x770202)
                .setFooter({ text: `At The Mile ModMail | To edit, use ${settings.prefix}snippets edit ${name}.` })
                .setDescription(`${additionalDesc}Sample Output:\n${val}`)

            await message.reply({
                embeds: [embed]
            })
        }
    }
}