import {EmbedBuilder, Message} from "discord.js";
import ModMailPrisma from "../api/ModMail";
import settings from "../settings.json"
import reservedSnippetNames from "../utils/reservedWords";

export default async function snippetFlow(message: Message) {
    const args = message.content.split(" ")[1]
    switch (args) {
        case "new": {
            const name = message.content.split(" ")[2]
            let val = message.content.split(" ").slice(3).join(" ")
            if (reservedSnippetNames.includes(name)) return await message.reply("This name is reserved for something else. Please use a different name.")
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

            return await message.reply({
                embeds: [embed]
            })
        }
        default: {
            if (!args) {
                const snippets = (await ModMailPrisma.GET.getSnippetList()).map(e => e.name)
                const embed = new EmbedBuilder()
                    .setTitle("Available Snippets")
                    .setColor(0x770202)
                    .setFooter({ text: "At The Mile ModMail" })
                    .setDescription(`To run a snippet in a ticket, run \`m![name]\`.\nTo preview a snippet, run \`m!snippets [name]\`.\n\n${snippets.join("\n")}`)

                return await message.reply({
                    embeds: [embed]
                })
            } else {
                const snippet = await ModMailPrisma.GET.getSnippetByName(args)
                if (!snippet) return await message.reply("This doesn't seem to be a snippet.")
                const embed = new EmbedBuilder()
                    .setTitle(`Snippet m!${snippet.name}`)
                    .setColor(0x770202)
                    .setFooter({ text: "At The Mile ModMail" })
                    .setDescription(snippet.val)

                return await message.reply({
                    embeds: [embed]
                })
            }
        }
    }
}