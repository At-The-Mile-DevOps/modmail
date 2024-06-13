import { EmbedBuilder, Message } from "discord.js"
import ModMailPrisma from "../api/ModMail"
import client from ".."

export default async function staffReplyFlow(message: Message) {
	const user = await ModMailPrisma.GET.getChannelTicketUser(message.channel.id)
	const content = message.content.split(" ")
	content.shift()
	if (!user) return
	const staffMember = message.member!
	const embed = new EmbedBuilder()
		.setDescription(content.join(" "))
		.setAuthor({ name: message.member?.displayName ?? message.author.username, iconURL: message.author.avatarURL() ?? undefined })
		.setFooter({ text: staffMember.roles.highest.name })
		.setColor(0x770202)
	const replyUser = await client.client.users.fetch(user)
	const userSentMessage = await replyUser.send({ embeds: [ embed ] })
	await message.delete()
	const staffSentMessage = await message.channel.send({ embeds: [ embed ] })

	return await ModMailPrisma.POST.createNewSequencedMessage(user, message.author.id, message.url, content.join(" "), userSentMessage.id, staffSentMessage.id, false, staffMember.displayName, true)
}