import { ModMailStatus } from "@prisma/client";
import { EmbedBuilder, Message, TextChannel } from "discord.js";
import client from "..";
import settings from "../settings.json"
import ModMailPrisma from "../api/ModMail";
import catLogger from "../utils/catloggr";

/**
 * Handles all ticket replies from the user.
 * @param message The message from the `outgoing.ts` listener.
 * @param channel The `ModMailStatus` body relating to the ticket.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function ticketReplyFlow(message: Message, channel: ModMailStatus) {
	
	let claimUser = channel.claimedBy
	
	const status = await ModMailPrisma.GET.isMarkedForDeletion(message.author.id)
	
	const channelResolvable = await ((await client.client.guilds.fetch(settings.GUILD_ID)).channels.fetch(channel.channel!)) as TextChannel
	
	if (status) {
		
		clearTimeout(status)
		
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
		.setDescription(message.content)
		.setColor(0x770202)
		.setFooter({ text: "Ticket User" })
	
	if (claimUser) {
		const staffMsg = await channelResolvable.send({
			content: `<@${claimUser}>`,
			embeds: [ embed ]
		})
		
		await ModMailPrisma.POST.newSequencedMessage(message.author.id, message.author.id, message.url, message.content, message.id, staffMsg.id, false, message.author.username)
	
	} else {
		const staffMsg = await channelResolvable.send({
			embeds: [ embed ]
		})
		
		await ModMailPrisma.POST.newSequencedMessage(message.author.id, message.author.id, message.url, message.content, message.id, staffMsg.id, false, message.author.username)
	}

	catLogger.events("User Ticket Open Flow Concluded - Ticket Opened")

	return await message.react("✅")
}