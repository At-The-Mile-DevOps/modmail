import { CategoryChannel, EmbedBuilder, Message } from "discord.js"
import ModMailPrisma from "../api/ModMail"
import client from ".."
import settings from "../settings.json"
import newMessageEmbed from "./newMessageEmbed"
import { PendingMessages } from "@prisma/client"

export default async function ticketOpenFlow(message: Message, bufferMsg: PendingMessages) {
	const respondCategory = message.content.split(" ")[ 0 ]
	if (respondCategory === "cancel") {
		return message.reply({ content: "Ticket cancelled. Have a great day!" })
	}
	const categoryId = await ModMailPrisma.GET.getCategoryByName(respondCategory)
	const guild = await client.client.guilds.fetch(settings.GUILD_ID)
	const guildUser = await guild.members.fetch(message.author.id)
	const firstEmbed = await newMessageEmbed(guildUser)
	const introEmbed = new EmbedBuilder()
		.setAuthor({
			name: message.author.username,
			iconURL: message.author.avatarURL() ?? "https://imgur.com/a/mSdQgiK"
		})
		.setDescription(bufferMsg.content)
		.setColor(0x770202)
		.setFooter({ text: "Ticket User" })
	if (!categoryId) {
		const pending = await ModMailPrisma.GET.getCategoryByName("pending") as string // always defined by setup procedures
		const guild = await client.client.guilds.fetch(settings.GUILD_ID)
		const category = await guild.channels.fetch(pending) as CategoryChannel
		const newChannel = await category.children.create({
			name: `pending-${message.author.username}`,
			topic: `ModMail conversation with ID ${message.author.id} | Claimed by no one.`
		})
		const sentMessage = await newChannel.send({ embeds: [ firstEmbed, introEmbed ] })
		await ModMailPrisma.POST.createNewModmailThread(message.author.id, newChannel.id)
		await ModMailPrisma.POST.createNewSequencedMessage(message.author.id, message.author.id, message.url, message.content, message.id, sentMessage.id, false, message.author.username)
	} else {
		const guild = await client.client.guilds.fetch(settings.GUILD_ID)
		const category = await guild.channels.fetch(categoryId) as CategoryChannel
		const newChannel = await category.children.create({
			name: `pending-${message.author.username}`,
			topic: `ModMail conversation with ID ${message.author.id} | Claimed by no one.`
		})
		const sentMessage = await newChannel.send({ embeds: [ firstEmbed, introEmbed ] })
		await ModMailPrisma.POST.createNewModmailThread(message.author.id, newChannel.id)
		await ModMailPrisma.POST.createNewSequencedMessage(message.author.id, message.author.id, message.url, message.content, message.id, sentMessage.id, false, message.author.username)
	}
	const embed = new EmbedBuilder()
		.setTitle("New ModMail Ticket")
		.setDescription(`Your ticket has been created! Please wait while a member of the appropriate department gets back to you.\n\nOriginal message: "${bufferMsg.content}"`)
		.setColor(0x770202)
		.setFooter({ text: "At The Mile ModMail" })
	return message.reply({
		embeds: [ embed ]
	})
}