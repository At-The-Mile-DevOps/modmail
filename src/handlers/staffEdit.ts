import {EmbedBuilder, Emoji, Message, TextBasedChannel} from "discord.js";
import ModMailPrisma from "../api/ModMail";
import client from "../index";

export default async function staffEditFlow(message: Message) {
    const channelId = message.channel.id
    const newContent = message.content.split(" ").slice(1).join(" ")
    const status = await ModMailPrisma.GET.getChannelTicketStatus(channelId)
    if (!status) return await message.reply("This can only be used in a ticket channel.")
    const updated = await ModMailPrisma.PATCH.updateMessageContent(message.author.id, newContent)
    if (!updated) return await message.reply("There is no past message by you to edit.")
    try {
        const staffMessage = await (message.channel as TextBasedChannel).messages.fetch(updated.staffMsgId)
        const newEmbed = new EmbedBuilder()
            .setDescription(newContent)
            .setColor(0x770202)
            .setFooter(staffMessage.embeds[0].footer)
            .setAuthor(staffMessage.embeds[0].author)

        await staffMessage.edit({
            embeds: [newEmbed]
        })
        const ticketUser = await client.client.users.fetch(updated.discordId)
        const dmMessage = await ticketUser.dmChannel?.messages.fetch(updated.msgId)
        if (!dmMessage) return message.reply("Could not update user's version of this message.")
        const newUserEmbed = new EmbedBuilder()
            .setDescription(newContent)
            .setColor(0x770202)
            .setFooter(dmMessage.embeds[0].footer)
            .setAuthor(dmMessage.embeds[0].author)
        await dmMessage.edit({
            embeds: [newUserEmbed]
        })
        return await message.react("✅")
    } catch (e: any) {
        return await message.reply("Could not find the target message to edit.")
    }

}