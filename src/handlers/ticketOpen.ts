import { CategoryChannel, EmbedBuilder, Message } from "discord.js"
import ModMailPrisma from "../api/ModMail"
import client from ".."
import settings from "../settings.json"
import newMessageEmbed from "./newMessageEmbed"
import catLogger from "../utils/catloggr"

/**
 * Handles all ticket openings.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function ticketOpenFlow(message: Message) {
	
	const guild = await client.client.guilds.fetch(settings.GUILD_ID)
	const guildUser = await guild.members.fetch(message.author.id)
	
	const firstEmbed = await newMessageEmbed(guildUser)
	
	const introEmbed = new EmbedBuilder()
		.setAuthor({
			name: message.author.username,
			iconURL: message.author.avatarURL() ?? "https://imgur.com/a/mSdQgiK"
		})
		.setDescription(message.content)
		.setColor(0x770202)
		.setFooter({ text: "Ticket User" })
	
	const pending = await ModMailPrisma.GET.getCategoryByName("pending") as string // always defined by setup procedures
	const category = await guild.channels.fetch(pending) as CategoryChannel
	
	const newChannel = await category.children.create({
		name: `${message.author.username}`,
		topic: `ModMail conversation with ID ${message.author.id} | Claimed by no one.`
	})
	
	const sentMessage = await newChannel.send({ embeds: [ firstEmbed, introEmbed ] })
	
	await ModMailPrisma.POST.newModMailThread(message.author.id, newChannel.id)
	
	await ModMailPrisma.POST.newSequencedMessage(message.author.id, message.author.id, message.url, message.content, message.id, sentMessage.id, false, message.author.username)
	
	const attachments = message.attachments
	attachments.forEach(async m => {
		let imgMessage;
		if (m.contentType?.includes("image/")) {
			const imgEmbed = new EmbedBuilder()
				.setTitle("Attached Image")
				.setColor(0x770202)
				.setFooter({ text: "Ticket User" })
				.setImage(m.proxyURL)

			imgMessage = await newChannel.send({ embeds: [ imgEmbed ] })
		} else {
			imgMessage = await newChannel.send({ content: `Attached file with name ${m.name} - **be careful when clicking on unknown files!** When in doubt, do not click.\n\n${m.proxyURL}` })
		}
		
		await ModMailPrisma.POST.newSequencedMessage(message.author.id, message.author.id, m.proxyURL, `User attached image with the following proxy URL - ${m.proxyURL}.`, m.id, imgMessage.id, false, message.author.username)
	})
	
	await message.react("✅")
	
	const embed = new EmbedBuilder()
		.setTitle("New ModMail Ticket")
		.setDescription(`Your ticket has been created! Please wait while a member of the appropriate department gets back to you.`)
		.setColor(0x770202)
		.setFooter({ text: "At The Mile ModMail" })

	catLogger.events("User Ticket Open Flow Concluded - Ticket Opened")
	
	return message.reply({
		embeds: [ embed ]
	})
}