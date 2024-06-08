import { CategoryChannel, ChannelType, EmbedBuilder, Events, Message, TextChannel } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import client from "..";
import settings from "../settings.json"
import LogEmitter from "../handlers/LogEmitter";
import newMessageEmbed from "../handlers/newMessageEmbed";
import ticketOpenFlow from "../handlers/ticketOpen";
import ticketReplyFlow from "../handlers/ticketReply";

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message: Message) {
		if (message.channel.type !== ChannelType.DM) return
		if (message.author.bot) return
		if (message.author.id !== "413462464022446084") return
		const channel = await ModMailPrisma.GET.getUserTicketObject(message.author.id)
		if (!channel || !channel.channel) {
			
			await ticketOpenFlow(message)
		} else {
			await ticketReplyFlow(message, channel)
		}

		return LogEmitter.emit('userMessage', message.author.id)
	}
}