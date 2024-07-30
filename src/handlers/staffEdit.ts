import { EmbedBuilder, Emoji, GuildTextBasedChannel, Message, TextBasedChannel } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import client from "../index";
import catLogger from "../utils/catloggr";
import { MainTracer } from "../utils/trace";

/**
 * Handles all staff message edits.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function staffEditFlow(message: Message, traceId: string) {
    try {
        MainTracer.appendToTrace(traceId, {
            subFlowEntry: "Entered Staff Edit Subflow Handler"
        })
        const channelId = message.channel.id
        
        let newContent = message.content.split(" ").slice(1).join(" ")
        if (newContent.length === 0) newContent = "*No text content attached.*"

        const status = await ModMailPrisma.GET.getTicketUserByChannel(channelId)
        if (!status) {
            MainTracer.appendToTrace(traceId, {
				exitReason: "No existing ticket"
			})
			MainTracer.closeTrace(traceId, true)
            return await message.reply("This can only be used in a ticket channel.")
        }

        const updated = await ModMailPrisma.PATCH.editMessageContent(message.author.id, status, newContent)
        if (!updated) {
            MainTracer.appendToTrace(traceId, {
				exitReason: "No existing message to edit"
			})
			MainTracer.closeTrace(traceId, true)
            return await message.reply("There is no past message by you to edit.")
        }

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
            if (!dmMessage) {
                MainTracer.appendToTrace(traceId, {
				    dmEditStatus: false
			    })
                MainTracer.closeTrace(traceId, false)
                return message.reply("Could not update user's version of this message.")
            }
            MainTracer.appendToTrace(traceId, {
                dmEditStatus: true
            })
            
            const newUserEmbed = new EmbedBuilder()
                .setDescription(newContent)
                .setColor(0x770202)
                .setFooter(dmMessage.embeds[ 0 ].footer)
                .setAuthor(dmMessage.embeds[ 0 ].author)
            
            await dmMessage.edit({
                embeds: [ newUserEmbed ]
            })

            catLogger.events("Staff Edit Reply Flow Concluded - Message Edited")
            
            await message.react("✅")
            MainTracer.appendToTrace(traceId, {
			    exitReason: "Gracefully exited Staff Edit flow"
            })
            MainTracer.closeTrace(traceId, true)

        } catch (e: any) {
            catLogger.debug("Error occurred within staff edit message resolution:")
            catLogger.debug(e.message)
            MainTracer.appendToTrace(traceId, {
                exitReason: "Catch loop invoked for message resolver.",
                errorMessage: e.message
            })
            MainTracer.closeTrace(traceId, false)
        }
    } catch (e: any) {
        catLogger.debug("Error occurred within staff edit subflow handler:")
        catLogger.debug(e.message)
        MainTracer.appendToTrace(traceId, {
            exitReason: "Catch loop invoked.",
            errorMessage: e.message
        })
        MainTracer.closeTrace(traceId, false)
    }

}