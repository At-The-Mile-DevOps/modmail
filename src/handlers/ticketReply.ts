import { ModMailStatus } from "@prisma/client";
import { EmbedBuilder, Message, TextChannel } from "discord.js";
import client from "..";
import settings from "../settings.json"

export default async function ticketReplyFlow(message: Message, channel: ModMailStatus) {
	let claimUser = channel.claimedBy
	const embed = new EmbedBuilder()
		.setAuthor({
			name: message.author.username,
			iconURL: message.author.avatarURL() ?? "https://imgur.com/a/mSdQgiK"
		})
		.setDescription(message.content)
		.setColor(0x770202)
		.setFooter({ text: "Ticket User" })
	const channelResolvable = await ((await client.client.guilds.fetch(settings.GUILD_ID)).channels.fetch(channel.channel!)) as TextChannel
	if (claimUser) {
		await channelResolvable.send({
			content: `<@${claimUser}>`,
			embeds: [ embed ]
		})
	} else {
		await channelResolvable.send({
			embeds: [ embed ]
		})
	}
}