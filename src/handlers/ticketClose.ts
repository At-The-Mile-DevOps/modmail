import {AttachmentBuilder, EmbedBuilder, Message, TextChannel, time} from "discord.js"
import ModMailPrisma from "../api/ModMail"
import client from ".."
import settings from "../settings.json"

export default async function ticketCloseFlow(message: Message) {
	const status = await ModMailPrisma.GET.getChannelTicketStatus(message.channel.id)
	if (!status) {
		await message.reply({content: "This must be used in an active ticket channel!"})
		return [false, null, null]
	} else {
		const args = message.content.split(" ")
		args.shift()
		let argExists = (args[0] !== undefined)
		if (argExists) {
			if (args[0] == "cancel") {
				const user = await ModMailPrisma.GET.getChannelTicketUser(message.channel.id)
				if (!user) return await message.reply("There is no user to close a ticket for.")
				const status = await ModMailPrisma.GET.checkMarkedForDeletion(user)
				if (status) {
					clearTimeout(status)
					const embed = new EmbedBuilder()
						.setTitle("Close Cancelled")
						.setDescription("Scheduled close cancelled.")
						.setColor(0x770202)
						.setFooter({text: "At The Mile ModMail"})

					await message.reply({
						embeds: [embed]
					})
					return await ModMailPrisma.PATCH.cancelDeletion(user)
				}
				}
				let delayed = args[0].match(/[0-9]{1,}[mhd]/g)
				if (delayed) {
					const user = await ModMailPrisma.GET.getChannelTicketUser(message.channel.id) as string // legal as we know the channel is bound atp
					const unit = args[0].charAt(args[0].length - 1)
					let flag = false
					let amount = parseInt(args[0].slice(0, args[0].length - 1))
					let totalAmount = 0
					switch (unit) {
						case "m": {
							if (amount > 4320) {
								amount = 4320
								flag = true
							}
							totalAmount = (amount * 60 * 1000)
							break
						}
						case "h": {
							if (amount > 72) {
								amount = 72
								flag = true
							}
							totalAmount = (amount * 60 * 60 * 1000)
							break
						}
						case "d": {
							if (amount > 3) {
								amount = 3
								flag = true
							}
							totalAmount = (amount * 60 * 60 * 24 * 1000)
						}
					}
					args.shift()
					const closeScheduleEmbed = new EmbedBuilder()
						.setTitle("Scheduled Close")
						.setDescription(`Close scheduled for ${amount} ${unit == "m" ? "minutes" : unit == "d" ? "days" : "hours"} from this message.${flag ? "\nThis close was truncated to 3 days." : ""}`)
						.setColor(0x770202)
						.setFooter({text: "At The Mile ModMail"})
					await message.reply({
						embeds: [closeScheduleEmbed]
					})
					const timeoutId = setTimeout(async () => {
						await closeFunction(message, args.join(" "))
					}, totalAmount)
					return await ModMailPrisma.PATCH.markForDeletion(user, `${timeoutId as any}`)
				} else {
					await closeFunction(message, args.join(" "))
				}
			} else {
				await closeFunction(message, "No reason provided.")
			}
		}
	}

async function closeFunction(message: Message, args: string) {
	const user = await ModMailPrisma.GET.getChannelTicketUser(message.channel.id) as string // legal as we know the channel is bound atp
	const [transcriptText, staffTranscriptText] = await ModMailPrisma.GET.printTranscript(user)
	transcriptText.push(`System: Ticket closed. Reason: ${args}`)
	const buffer = Buffer.from(transcriptText.join(`\n`), "utf-8")
	const transcriptAttachment = new AttachmentBuilder(buffer, {
		name: "transcript.txt",
		description: "A transcript of your ModMail conversation."
	})

	const staffBuffer = Buffer.from(staffTranscriptText.join('\n'), 'utf-8')
	const staffTranscriptAttachment = new AttachmentBuilder(staffBuffer, {
		name: "staff-transcript.txt",
		description: `A staff-level transcript of the last ModMail conversation.`
	})
	const embed = new EmbedBuilder()
		.setTitle("Ticket Closed")
		.setDescription(`Close Reason: ${args}\n\nWe hope your experience using ModMail was as enjoyable as possible, and we hope your questions or concerns have been addressed. Attached below is your transcript. Please don't hesitate to contact us with any issues.`)
		.setColor(0x770202)
		.setFooter({ text: "At The Mile ModMail" })
	const transcriptChannel = (message.channel as TextChannel).parent!.children.cache.find(e => e.name.includes("transcripts")) as TextChannel
	await (await client.client.users.fetch(user)).send({ files: [ transcriptAttachment ], embeds: [ embed ] })
	await transcriptChannel.send({ files: [ staffTranscriptAttachment ], content: `Transcript from ModMail thread with user ${user} (<@${user}>). Reason for closure: ${args}` })
	await (await (await client.client.guilds.fetch(settings.GUILD_ID)).channels.fetch(message.channel.id))?.delete(`Ticket closed.`)
	await ModMailPrisma.DELETE.removeTicket(user)
	return [true, user, message.author.id]
}