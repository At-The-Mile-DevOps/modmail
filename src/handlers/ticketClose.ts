import { AttachmentBuilder, EmbedBuilder, Message, TextChannel } from "discord.js"
import ModMailPrisma from "../api/ModMail"
import client from ".."
import settings from "../settings.json"

export default async function ticketCloseFlow(message: Message) {
	const channelId = message.channel.id
	const status = await ModMailPrisma.GET.getChannelTicketStatus(channelId)
	if (!status) {
		message.reply({ content: "This must be used in an active ticket channel!" })
		return [false, null, null]
	} else {
		const user = await ModMailPrisma.GET.getChannelTicketUser(channelId) as string // legal as we know the channel is bound atp
		const transcriptText = await ModMailPrisma.GET.printTranscript(user)
		transcriptText.push("System: Ticket closed.")
		const buffer = Buffer.from(transcriptText.join(`\n`), "utf-8")
		const transcriptAttachment = new AttachmentBuilder(buffer, {
			name: "transcript.txt",
			description: "A transcript of your ModMail conversation."
		})
		const embed = new EmbedBuilder()
			.setTitle("Ticket Closed")
			.setDescription("We hope your experience using ModMail was as enjoyable as possible, and we hope your questions or concerns have been addressed. Attached below is your transcript. Please don't hesitate to contact us with any issues.")
			.setColor(0x770202)
			.setFooter({ text: "At The Mile ModMail" })
		await (await client.client.users.fetch(user)).send({ files: [ transcriptAttachment ], embeds: [ embed ] })
		await (await (await client.client.guilds.fetch(settings.GUILD_ID)).channels.fetch(settings.transcript_channel) as TextChannel).send({ files: [ transcriptAttachment ], content: `Transcript from ModMail thread with user ${user} (<@${user}>)` })
		await (await (await client.client.guilds.fetch(settings.GUILD_ID)).channels.fetch(channelId))?.delete("Ticket closed.")
		await ModMailPrisma.DELETE.removeTicket(user)
		return [true, user, message.author.id]
	}
}