import { ModMailStatus } from "@prisma/client";
import { Attachment, EmbedBuilder, Message, TextChannel } from "discord.js";
import client from "..";
import settings from "../settings.json"
import ModMailPrisma from "../api/ModMail";
import catLogger from "../utils/catloggr";
import { MainTracer } from "../utils/trace";

/**
 * Handles all ticket replies from the user.
 * @param message The message from the `outgoing.ts` listener.
 * @param channel The `ModMailStatus` body relating to the ticket.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function ticketReplyFlow(message: Message, channel: ModMailStatus, traceId: string) {
	try {
		MainTracer.appendToTrace(traceId, {
			subFlowEntry: "Entered Ticket Reply Subflow Handler"
		})
		let claimUser = channel.claimedBy
		
		const status = await ModMailPrisma.GET.isMarkedForDeletion(message.author.id)
		
		const channelResolvable = await ((await client.client.guilds.fetch(settings.GUILD_ID)).channels.fetch(channel.channel!)) as TextChannel
		
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

			await channelResolvable.send({
				embeds: [ embed ]
			})

			await ModMailPrisma.PATCH.resetDeletion(message.author.id)
		}
		
		const embed = new EmbedBuilder()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.avatarURL() ?? "https://imgur.com/a/mSdQgiK"
			})
			.setDescription(`${message.content.length > 0 ? message.content : "*No text content attached.*"}`)
			.setColor(0x770202)
			.setFooter({ text: "Ticket User" })

		const files: Attachment[] = []

		const attachments = message.attachments
		attachments.forEach(async m => {
			files.push(m)
		})
		
		if (claimUser) {
			const staffMsg = await channelResolvable.send({
				content: `<@${claimUser}>`,
				embeds: [ embed ],
				files
			})
			
			await ModMailPrisma.POST.newSequencedMessage(message.author.id, message.author.id, message.url, message.content, message.id, staffMsg.id, false, message.author.username)
		
		} else {
			const staffMsg = await channelResolvable.send({
				embeds: [ embed ],
				files
			})
			
			await ModMailPrisma.POST.newSequencedMessage(message.author.id, message.author.id, message.url, message.content, message.id, staffMsg.id, false, message.author.username)
		}

		catLogger.events("User Ticket Reply Flow Concluded")

		await message.react("✅")
		MainTracer.appendToTrace(traceId, {
			exitReason: "Gracefully exited Ticket Reply handler"
		})
		MainTracer.closeTrace(traceId, true)
		return
	} catch (e: any) {
		catLogger.debug("Error occurred within ticket reply subflow handler:")
        catLogger.debug(e.message)
        MainTracer.appendToTrace(traceId, {
            exitReason: "Catch loop invoked.",
            errorMessage: e.message
        })
        MainTracer.closeTrace(traceId, false)
	}
}