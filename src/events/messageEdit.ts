import { ChannelType, EmbedBuilder, Events, Message, PartialMessage, TextBasedChannel } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import client from "../index";
import settings from "../settings.json"
import catLogger from "../utils/catloggr";
import { rateLimit } from "../@types/types";
import { MainTracer } from "../utils/trace";
import { v4 as uuidv4 } from "uuid"

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
        rateLimit.use(async () => {
            await messageEditRequest(oldMessage, newMessage)
        })
    }
}

async function messageEditRequest(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    const id = uuidv4().slice(8)
    MainTracer.startTrace(id, {})
    try {
        // Resolve partials if they exist
        if (oldMessage.partial) {
            oldMessage = await oldMessage.fetch()
            MainTracer.appendToTrace(id, {
                oldMessagePartialResolved: true
            })
        }
        if (newMessage.partial) {
            newMessage = await newMessage.fetch()
            MainTracer.appendToTrace(id, {
                newMessagePartialResolved: true
            })
        }

        if (oldMessage.channel.type != ChannelType.DM) {
            MainTracer.appendToTrace(id, {
                exitReason: "Not a qualifying message edit."
            })
            MainTracer.closeTrace(id, true)
            return
        }

        if (!newMessage.editedAt) {
            MainTracer.appendToTrace(id, {
                exitReason: "No valid edits submitted."
            })
            MainTracer.closeTrace(id, true)
            return
        }

        const oldMessageId = oldMessage.id
        const authorId = oldMessage.author.id
        const newContent = newMessage.content
        MainTracer.appendToTrace(id, {
            oldMessageId,
            authorId,
            newContent
        })

        const modMailStatus = await ModMailPrisma.GET.getUserTicketObject(oldMessage.author.id)
        if (!modMailStatus) {
            MainTracer.appendToTrace(id, {
                exitReason: "No valid ModMail instance."
            })
            MainTracer.closeTrace(id, true)
            return
        }

        const messageEdit = await ModMailPrisma.PATCH.editMessageContent(authorId, newContent, oldMessageId)
        if (!(await ModMailPrisma.GET.isMessageValid(authorId, oldMessageId)) || !messageEdit) {
            MainTracer.appendToTrace(id, {
                exitReason: "Error occurred while handling message edit in Prisma."
            })
            MainTracer.closeTrace(id, false)
            return
        }

        catLogger.events("User Message Edit Flow Started")

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

        await oldStaffMessage.edit({ embeds: [ newEmbed ] })

        MainTracer.appendToTrace(id, {
            exitReason: "Gracefully exited message edit handler."
        })
        MainTracer.closeTrace(id, true)
    } catch (e: any) {
        catLogger.debug("Error occurred within incoming message handler:")
        catLogger.debug(e.message)
        MainTracer.appendToTrace(id, {
            exitReason: "Catch loop invoked.",
            errorMessage: e.message
        })
        MainTracer.closeTrace(id, false)
    }
}