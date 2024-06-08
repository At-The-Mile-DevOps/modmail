import {ChannelType, Events, Message} from "discord.js";
import ModMailPrisma from "../api/ModMail";
import LogEmitter from "../handlers/LogEmitter";
import ticketOpenFlow from "../handlers/ticketOpen";
import ticketReplyFlow from "../handlers/ticketReply";
import {Permit} from "../@types/types";

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message: Message) {
		if (message.channel.type !== ChannelType.DM) return
		if (message.author.bot) return await message.reply({ content: "You currently do not have permission to access this ModMail feature." })
		const permit = await ModMailPrisma.GET.getUserPermit(message.author.id)
		if (permit < Permit.EARLY_ACCESS_STAFF) return
		const channel = await ModMailPrisma.GET.getUserTicketObject(message.author.id)
		if (!channel || !channel.channel) {
			
			await ticketOpenFlow(message)
		} else {
			await ticketReplyFlow(message, channel)
		}

		return LogEmitter.emit('userMessage', message.author.id)
	}
}