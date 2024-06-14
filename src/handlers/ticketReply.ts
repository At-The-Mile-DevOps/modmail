import { ModMailStatus } from "@prisma/client";
import { EmbedBuilder, Message, TextChannel } from "discord.js";
import client from "..";
import settings from "../settings.json"
import ModMailPrisma from "../api/ModMail";

export default async function ticketReplyFlow(message: Message, channel: ModMailStatus) {
	let claimUser = channel.claimedBy
	const status = await ModMailPrisma.GET.checkMarkedForDeletion(message.author.id)
	const channelResolvable = await ((await client.client.guilds.fetch(settings.GUILD_ID)).channels.fetch(channel.channel!)) as TextChannel
	if (status) {
		clearTimeout(status)
		const embed = new EmbedBuilder()
			.setTitle("Close Cancelled")
			.setDescription("Scheduled close cancelled.")
			.setColor(0x770202)
			.setFooter({ text: "At The Mile ModMail" })

		await channelResolvable.send({
			embeds: [embed]
		})

		await ModMailPrisma.PATCH.cancelDeletion(message.author.id)
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
		await ModMailPrisma.POST.createNewSequencedMessage(message.author.id, message.author.id, message.url, message.content, message.id, staffMsg.id, false, message.author.username)
	} else {
		const staffMsg = await channelResolvable.send({
			embeds: [ embed ]
		})
		await ModMailPrisma.POST.createNewSequencedMessage(message.author.id, message.author.id, message.url, message.content, message.id, staffMsg.id, false, message.author.username)
	}
	return await message.react("✅")
}