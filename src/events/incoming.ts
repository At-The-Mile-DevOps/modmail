import { ChannelType, Events, Message } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import ticketOpenFlow from "../handlers/ticketOpen";
import ticketReplyFlow from "../handlers/ticketReply";
import { Permit, rateLimit } from "../@types/types";
import catLogger from "../utils/catloggr";

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
			const permit = await ModMailPrisma.GET.getUserPermit(message.author.id)
			if (permit < Permit.EARLY_ACCESS_STAFF) return await message.reply({ content: "You currently do not have permission to access this ModMail feature." })
			const channel = await ModMailPrisma.GET.getUserTicketObject(message.author.id)
			if (!channel || !channel.channel) {
				catLogger.events("Ticket Open Flow Started")
				await ticketOpenFlow(message)
			} else {
				catLogger.events("Ticket Reply Flow Started")
				await ticketReplyFlow(message, channel)
			}

		}

		// Handles hidden messages.
		case ChannelType.GuildText: {
			const status = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
			if (!status) return
			else {
				catLogger.events("Staff Hidden Message Flow Started")
				return await ModMailPrisma.POST.newSequencedMessage(status, message.author.id, message.url, message.content, '0', message.id, false, message.author.displayName, true, true)
			}
		}
	}
}