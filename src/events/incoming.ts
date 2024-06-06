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
			const bufferMsg = await ModMailPrisma.GET.getTemporaryMessage(message.author.id)
			if (!bufferMsg) {
				const categories = (await ModMailPrisma.GET.getCategoryList()).map(e => e.name)
				categories.forEach(e => e = `\`${e}\``)
				const embed = new EmbedBuilder()
					.setTitle("New ModMail Ticket")
					.setDescription(`**Hey there!** Thanks for contacting us. Before we start, please send one of the categories below that you feel this ticket best fits into. If none of these seem right, just say 'other'. If you've changed your mind, say 'cancel'.\n\n${categories.join("\n")}`)
					.setColor(0x770202)
					.setFooter({ text: "At The Mile ModMail" })
				await ModMailPrisma.POST.addTemporaryMessage(message.author.id, message.content)
				await message.reply({ embeds: [embed] })
			} else {
				await ticketOpenFlow(message, bufferMsg)
			}
		} else {
			await ticketReplyFlow(message, channel)
		}

		return LogEmitter.emit('userMessage', message.author.id)
	}
}