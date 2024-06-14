import { ChannelType, EmbedBuilder, Events, Message, PartialMessage, TextBasedChannel } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import client from "../index";
import settings from "../settings.json"

/**
 * Handles all message edit events in a DM - instances where the user wishes to update their message seamlessly.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
module.exports = {
    name: Events.MessageUpdate,
    once: false,
    async execute(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {

        // Resolve partials if they exist
        if (oldMessage.partial) {
            oldMessage = await oldMessage.fetch()
        }
        if (newMessage.partial) {
            newMessage = await newMessage.fetch()
        }

        if (oldMessage.channel.type != ChannelType.DM) return

        if (!newMessage.editedAt) return

        const oldMessageId = oldMessage.id
        const authorId = oldMessage.author.id
        const newContent = newMessage.content
        
        const modMailStatus = await ModMailPrisma.GET.getUserTicketObject(oldMessage.author.id)
        if (!modMailStatus) return
        
        const messageEdit = await ModMailPrisma.PATCH.editMessageContent(authorId, newContent, oldMessageId)
        if (!(await ModMailPrisma.GET.isMessageValid(authorId, oldMessageId)) || !messageEdit) return
        
        const guild = await client.client.guilds.fetch(settings.GUILD_ID)
        const channel = await guild.channels.fetch(modMailStatus.channel!) as TextBasedChannel
        const oldStaffMessage = await channel.messages.fetch(messageEdit.staffMsgId)
        
        const newEmbed = new EmbedBuilder()
            .setColor(0x770202)
            .setFooter({ text: "Ticket User" })
            .addFields(
                {
                    name: "Old Message",
                    value: `${oldMessage.content}`,
                    inline: true
                },
                {
                    name: "New Message",
                    value: `${newMessage.content}`,
                    inline: true
                }
            )
            .setAuthor({ name: oldMessage.author.username, iconURL: oldMessage.author.avatarURL() ?? "https://imgur.com/a/mSdQgiK" })

        return await oldStaffMessage.edit({ embeds: [ newEmbed ] })
    }
}