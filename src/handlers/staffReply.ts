import { Attachment, EmbedBuilder, Message } from "discord.js"
import ModMailPrisma from "../api/ModMail"
import client from ".."
import catLogger from "../utils/catloggr"
import { MainTracer } from "../utils/trace"

/**
 * Handles all staff normal replies.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function staffReplyFlow(message: Message, traceId: string) {
	try {
		MainTracer.appendToTrace(traceId, {
			subFlowEntry: "Entered Staff Reply Subflow Handler"
		})
		const user = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
		if (!user) {
			MainTracer.appendToTrace(traceId, {
				exitReason: "No existing ModMail status"
			})
			MainTracer.closeTrace(traceId, true)
			return
		}
		
		const status = await ModMailPrisma.GET.isMarkedForDeletion(user)
		if (status) {
			clearTimeout(status)
			MainTracer.appendToTrace(traceId, {
				cancelledDeletion: true
			})
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
		if (content.length === 0) content.push("*No text content attached.*")
		
		const staffMember = message.member!
		
		const embed = new EmbedBuilder()
			.setDescription(content.join(" "))
			.setAuthor({ name: message.member?.displayName ?? message.author.username, iconURL: message.author.avatarURL() ?? undefined })
			.setFooter({ text: staffMember.roles.highest.name })
			.setColor(0x770202)

		const files: Attachment[] = []

		const attachments = message.attachments
		attachments.forEach(async m => {
			files.push(m)
		})
		
		const replyUser = await client.client.users.fetch(user)
		const userSentMessage = await replyUser.send({ embeds: [ embed ], files })
		const staffSentMessage = await message.reply({ embeds: [ embed ], files })

		await message.delete()

		await ModMailPrisma.POST.newSequencedMessage(replyUser.id, message.author.id, userSentMessage.url, content.join(" "), userSentMessage.id, staffSentMessage.id, false, message.author.username, true, false, false)


		catLogger.events("Staff Reply Flow Concluded - Reply Sent")
		MainTracer.appendToTrace(traceId, {
			exitReason: "Gracefully exited Staff Reply flow."
		})
		MainTracer.closeTrace(traceId, true)
		return
	} catch (e: any) {
		catLogger.debug("Error occurred within staff reply subflow handler:")
        catLogger.debug(e.message)
        MainTracer.appendToTrace(traceId, {
            exitReason: "Catch loop invoked.",
            errorMessage: e.message
        })
        MainTracer.closeTrace(traceId, false)
	}
}