import { EmbedBuilder, Message, TextChannel } from "discord.js"
import ModMailPrisma from "../api/ModMail"
import client from ".."

export default async function transferFlow(message: Message) {
	const user = await ModMailPrisma.GET.getChannelTicketUser(message.channel.id)
	if (!user) return message.reply({ content: "This command can only be used in a ticket channel." })
	const args = message.content.split(" ")[ 1 ].toLowerCase()
	const categories = await ModMailPrisma.GET.getCategoryList()
	const categoryNames = categories.map(e => e.name)
	const categoryIds = categories.map(e => e.channelId)
	if (!(categoryNames.includes(args))) return message.reply({ content: "This transfer category does not exist." })
	const embed = new EmbedBuilder()
		.setTitle("Ticket Transfer Started")
		.setDescription("Please wait while your ticket is transferred to the appropriate department.")
		.setFooter({ text: "At The Mile ModMail" })
		.setColor(0x770202)
	const replyUser = await client.client.users.fetch(user)
	const userSentMessage = await replyUser.send({ embeds: [ embed ] })
	await message.delete()
	const staffSentMessage = await message.channel.send({ embeds: [ embed ] })
	await ModMailPrisma.POST.createNewSequencedMessage(user, message.author.id, message.url, "Ticket Transfer Started", userSentMessage.id, staffSentMessage.id, true, "At The Mile ModMail")
	await (message.channel as TextChannel).setParent(categoryIds[ categoryNames.indexOf(args) ])
	await (message.channel as TextChannel).setName(`${args}-${(message.channel as TextChannel).name.split("-")[ 1 ]}`)
}