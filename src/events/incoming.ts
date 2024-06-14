import { ChannelType, Events, Message } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import LogEmitter from "../handlers/LogEmitter";
import ticketOpenFlow from "../handlers/ticketOpen";
import ticketReplyFlow from "../handlers/ticketReply";
import { Permit } from "../@types/types";

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
		
		if (message.author.bot) return

		switch (message.channel.type) {

			// Handles incoming DM messages.
			case ChannelType.DM: {
				const permit = await ModMailPrisma.GET.getUserPermit(message.author.id)
				if (permit < Permit.EARLY_ACCESS_STAFF) return await message.reply({ content: "You currently do not have permission to access this ModMail feature." })
				const channel = await ModMailPrisma.GET.getUserTicketObject(message.author.id)
				if (!channel || !channel.channel) {

					await ticketOpenFlow(message)
				} else {
					await ticketReplyFlow(message, channel)
				}

				return LogEmitter.emit('userMessage', message.author.id)
			}

			// Handles hidden messages.
			case ChannelType.GuildText: {
				const status = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
				if (!status) return
				else {
					return await ModMailPrisma.POST.newSequencedMessage(status, message.author.id, message.url, message.content, '0', message.id, false, message.author.displayName, true, true)
				}
			}
		}
	}
}