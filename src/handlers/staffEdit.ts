import { EmbedBuilder, Emoji, GuildTextBasedChannel, Message, TextBasedChannel } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import client from "../index";
import catLogger from "../utils/catloggr";

/**
 * Handles all staff message edits.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function staffEditFlow(message: Message) {
    
    const channelId = message.channel.id
    
    let newContent = message.content.split(" ").slice(1).join(" ")
    if (newContent.length === 0) newContent = "*No text content attached.*"
    
    const status = await ModMailPrisma.GET.getTicketUserByChannel(channelId)
    if (!status) return await message.reply("This can only be used in a ticket channel.")

    const updated = await ModMailPrisma.PATCH.editMessageContent(message.author.id, status, newContent)
    if (!updated) return await message.reply("There is no past message by you to edit.")
    
    try {
        console.log(updated)
        const staffMessage = await (message.channel as TextBasedChannel).messages.fetch(updated.staffMsgId)
        
        const newEmbed = new EmbedBuilder()
            .setDescription(newContent)
            .setColor(0x770202)
            .setFooter(staffMessage.embeds[ 0 ].footer)
            .setAuthor(staffMessage.embeds[ 0 ].author)

        await staffMessage.edit({
            embeds: [ newEmbed ]
        })
        
        const ticketUser = await client.client.users.fetch(updated.discordId)
        
        const dmMessage = await ticketUser.dmChannel?.messages.fetch(updated.msgId)
        if (!dmMessage) return message.reply("Could not update user's version of this message.")
        
        const newUserEmbed = new EmbedBuilder()
            .setDescription(newContent)
            .setColor(0x770202)
            .setFooter(dmMessage.embeds[ 0 ].footer)
            .setAuthor(dmMessage.embeds[ 0 ].author)
        
        await dmMessage.edit({
            embeds: [ newUserEmbed ]
        })

        catLogger.events("Staff Edit Reply Flow Concluded - Message Edited")
        
        return await message.react("✅")
    
    } catch (e: any) {
       //  return await message.reply("Could not find the target message to edit.")
       console.log(e)
    }

}