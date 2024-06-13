import {ChannelType, EmbedBuilder, Events, Message, PartialMessage, TextBasedChannel} from "discord.js";
import ModMailPrisma from "../api/ModMail";
import client from "../index";
import settings from "../settings.json"

module.exports = {
    name: Events.MessageUpdate,
    once: false,
    async execute(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
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
        const messageEdit = await ModMailPrisma.PATCH.updateMessageContent(authorId, newContent, oldMessageId)
        if (!(await ModMailPrisma.GET.checkIfMessageValid(authorId, oldMessageId)) || !messageEdit) return
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
            .setAuthor({ name: oldMessage.author.username, iconURL: oldMessage.author.avatarURL() ?? "https://imgur.com/a/mSdQgiK"})

        return await oldStaffMessage.edit({ embeds: [newEmbed] })
    }
}