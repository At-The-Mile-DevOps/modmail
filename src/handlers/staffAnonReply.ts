import { EmbedBuilder, Message } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import client from "..";
import catLogger from "../utils/catloggr";

/**
 * Handles all anonymous staff replies.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function anonStaffReplyFlow(message: Message) {
	
	const user = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
	if (!user) return
	
	const status = await ModMailPrisma.GET.isMarkedForDeletion(user)
	if (status) {
		clearTimeout(status)
		const embed = new EmbedBuilder()
			.setTitle("Close Cancelled")
			.setDescription("Scheduled close cancelled.")
			.setColor(0x770202)
			.setFooter({ text: "At The Mile ModMail" })

		await message.reply({
			embeds: [ embed ]
		})
		
		catLogger.events("Ticket Scheduled Close Cancelled")

		await ModMailPrisma.PATCH.resetDeletion(user)
	}
	
	const content = message.content.split(" ")
	content.shift()
	if (content.length === 0) content.push("*No content attached.*")
	
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

	catLogger.events("Staff Anon Reply Flow Concluded - Anon Reply Sent")

	return await ModMailPrisma.POST.newSequencedMessage(user, message.author.id, message.url, content.join(" "), userSentMessage.id, staffSentMessage.id, true, staffMember.displayName, true)
}