import { ChannelType, Events, Message } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import ticketOpenFlow from "../handlers/ticketOpen";
import ticketReplyFlow from "../handlers/ticketReply";
import { Permit, rateLimit } from "../@types/types";
import catLogger from "../utils/catloggr";
import { MainTracer } from "../utils/trace";
import {v4 as uuidv4} from "uuid"

/**
 * Handles all **incoming** user queries.
 * An incoming query is defined as a query that comes to the bot via a DM.
 * Occasionally, this listener is used for hidden staff messages in ticket channels.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message: Message) {
		rateLimit.use(async () => {
			await incomingRequest(message)
		})
	}
}

async function incomingRequest(message: Message) {
	if (message.author.bot) return

	switch (message.channel.type) {

		// Handles incoming DM messages.
		case ChannelType.DM: {
			const id = uuidv4().slice(0,8)
			MainTracer.startTrace(id, {
				author: message.author.id,
				message: message.content,
				hasAttachments: (message.attachments.size > 0)
			})
			try {
				const permit = await ModMailPrisma.GET.getUserPermit(message.author.id)
				if (permit < Permit.EARLY_ACCESS_STAFF) {
					MainTracer.appendToTrace(id, {
						exitReason: "Inapplicable permit."
					})
					MainTracer.closeTrace(id, true)
					return await message.reply({ content: "You currently do not have permission to access this ModMail feature." })
				}
				const channel = await ModMailPrisma.GET.getUserTicketObject(message.author.id)
				if (!channel || !channel.channel) {
					catLogger.events("Ticket Open Flow Started")
					MainTracer.appendToTrace(id, {
						receiveResolution: "Entered Ticket Open Flow"
					})
					await ticketOpenFlow(message, id)
				} else {
					catLogger.events("Ticket Reply Flow Started")
					MainTracer.appendToTrace(id, {
						receiveResolution: "Entered Ticket Reply Flow"
					})
					await ticketReplyFlow(message, channel, id)
				}
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

		// Handles hidden messages.
		case ChannelType.GuildText: {
			try {
				const status = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
				if (!status) return
				else {
					catLogger.events("Staff Hidden Message Flow Started")
					return await ModMailPrisma.POST.newSequencedMessage(status, message.author.id, message.url, message.content, '0', message.id, false, message.author.displayName, true, true)
				}
			} catch (e: any) {
				catLogger.debug("Error occurred within incoming hidden message handler:")
				catLogger.debug(e.message)
			}
		}
	}
}