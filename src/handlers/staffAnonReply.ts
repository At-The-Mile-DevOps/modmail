import { EmbedBuilder, Message } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import client from "..";

export default async function anonStaffReplyFlow(message: Message) {
	const user = await ModMailPrisma.GET.getChannelTicketUser(message.channel.id)
	if (!user) return
	const status = await ModMailPrisma.GET.checkMarkedForDeletion(user)
	if (status) {
		clearTimeout(status)
		const embed = new EmbedBuilder()
			.setTitle("Close Cancelled")
			.setDescription("Scheduled close cancelled.")
			.setColor(0x770202)
			.setFooter({ text: "At The Mile ModMail" })

		await message.reply({
			embeds: [embed]
		})
		await ModMailPrisma.PATCH.cancelDeletion(user)
	}
	const content = message.content.split(" ")
	content.shift()
	const staffMember = message.member!
	const embed = new EmbedBuilder()
		.setDescription(content.join(" "))
		.setAuthor({ name: "Anonymous Message" })
		.setFooter({ text: "Support Representative" })
		.setColor(0x770202)
	const replyUser = await client.client.users.fetch(user)
	const userSentMessage = await replyUser.send({ embeds: [ embed ] })
	await message.delete()
	const staffSentMessage = await message.channel.send({ embeds: [ embed ] })

	return await ModMailPrisma.POST.createNewSequencedMessage(user, message.author.id, message.url, content.join(" "), userSentMessage.id, staffSentMessage.id, true, staffMember.displayName, true)
}