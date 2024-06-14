import {EmbedBuilder, Message} from "discord.js";
import ModMailPrisma from "../api/ModMail";
import settings from "../settings.json"
import reservedSnippetNames from "../utils/reservedWords";
import {Permit} from "../@types/types";

export default async function snippetFlow(message: Message) {
    const args = message.content.split(" ")[1]
    const permit = await ModMailPrisma.GET.getUserPermit(message.author.id)
    if (permit < Permit.HRM) return await message.reply("Only HRM+ can create, edit, and delete snippets.")
    switch (args) {
        case "new": {
            const name = message.content.split(" ")[2]
            let val = message.content.split(" ").slice(3).join(" ")
            let oldVal = val
            if (reservedSnippetNames.includes(name)) return await message.reply("This name is reserved for something else. Please use a different name.")

            let additionalDesc = ""
            let userSubMatches = val.match(/{u}/g)
            if (userSubMatches) {
                if (userSubMatches.length > 1) return await message.reply("You can only use one user replacement per snippet.")
                additionalDesc += `This snippet has a user mention substitution.\n`
                val = val.replace("{u}", `<@${settings.CLIENT_ID}>`)
            }

            let authorSubMatches = val.match(/{a}/g)
            if (authorSubMatches) {
                if (authorSubMatches.length > 1) return await message.reply("You can only use one author replacement per snippet.")
                additionalDesc += `This snipppt has an author mention substitution.\n`
                val = val.replace("{a}", `<@${message.author.id}>`)
            }

            let reasonSubMatches = val.match(/{r}/g)
            if (reasonSubMatches) {
                if (reasonSubMatches.length > 1) return await message.reply("You can only use one reason replacement per snippet.")
                additionalDesc += `This snippet has a reason substitution.\n`
                val = val.replace("{r}", `This is a sample reason.`)
            }

            const status = await ModMailPrisma.POST.addNewSnippet(name, oldVal)
            if (status === false) return message.reply({ content: "A snippet with that name already exists. Please use the edit command if you want to change the value." })

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
        case "edit": {
            const name = message.content.split(" ")[2]
            let val = message.content.split(" ").slice(3).join(" ")
            let oldVal = val
            const snippet = await ModMailPrisma.GET.getSnippetByName(name)
            if (!snippet) return await message.reply("This doesn't seem to be a snippet.")

            let additionalDesc = ""
            let userSubMatches = val.match(/{u}/g)
            if (userSubMatches) {
                if (userSubMatches.length > 1) return await message.reply("You can only use one user replacement per snippet.")
                additionalDesc += `This snippet has a user mention substitution.\n`
                val = val.replace("{u}", `<@${settings.CLIENT_ID}>`)
            }

            let authorSubMatches = val.match(/{a}/g)
            if (authorSubMatches) {
                if (authorSubMatches.length > 1) return await message.reply("You can only use one author replacement per snippet.")
                additionalDesc += `This snipppt has an author mention substitution.\n`
                val = val.replace("{a}", `<@${message.author.id}>`)
            }

            let reasonSubMatches = val.match(/{r}/g)
            if (reasonSubMatches) {
                if (reasonSubMatches.length > 1) return await message.reply("You can only use one reason replacement per snippet.")
                additionalDesc += `This snippet has a reason substitution.\n`
                val = val.replace("{r}", `This is a sample reason.`)
            }

            await ModMailPrisma.PATCH.updateSnippetValue(name, oldVal)

            const embed = new EmbedBuilder()
                .setTitle(`Snippet Edited`)
                .setColor(0x770202)
                .setFooter({ text: `At The Mile ModMail | To edit, use ${settings.prefix}snippets edit ${name}.` })
                .setDescription(`${additionalDesc}Sample Output:\n${val}`)

            return await message.reply({
                embeds: [embed]
            })
        }
        case "delete": {
            const name = message.content.split(" ")[2]
            const snippet = await ModMailPrisma.GET.getSnippetByName(name)
            if (!snippet) return await message.reply("This doesn't seem to be a snippet.")
            await ModMailPrisma.DELETE.removeSnippet(name)
            return await message.reply("Snippet deleted.")
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