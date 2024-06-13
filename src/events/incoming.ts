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
		if (message.author.bot) return
		switch (message.channel.type) {
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
			case ChannelType.GuildText: {
				const status = await ModMailPrisma.GET.getChannelTicketUser(message.channel.id)
				if (!status) return
				else {
					return await ModMailPrisma.POST.createNewSequencedMessage(status, message.author.id, message.url, message.content, '0', message.id, false, message.author.displayName, true, true)
				}
			}
		}
	}
}