import { EmbedBuilder, Message, TextChannel } from "discord.js"
import ModMailPrisma from "../api/ModMail"
import client from ".."

/**
 * Handles all ticket category transfers.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function transferFlow(message: Message) {
	
	const user = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
	if (!user) return message.reply({ content: "This command can only be used in a ticket channel." })
	
	const args = message.content.split(" ")[ 1 ].toLowerCase()
	
	const categories = await ModMailPrisma.GET.getCategoryBySearch(args)
	
	if (!categories || categories.length == 0) return await message.reply("There were no valid transfer categories.")
	
	const names = categories.map(e => `${e.name}${e.short ? ` (${e.short})` : ""}`)
	
	if (categories.length !== 1) return await message.reply(`The following options were returned. Please try again with a more specific request.\n${names.join("\n")}`)
	
	const embed = new EmbedBuilder()
		.setTitle("Ticket Transfer Started")
		.setDescription("Please wait while your ticket is transferred to the appropriate department.")
		.setFooter({ text: "At The Mile ModMail" })
		.setColor(0x770202)
	
	const replyUser = await client.client.users.fetch(user)
	
	const userSentMessage = await replyUser.send({ embeds: [ embed ] })
	await message.delete()
	
	const staffSentMessage = await message.channel.send({ embeds: [ embed ] })
	
	await ModMailPrisma.POST.newSequencedMessage(user, message.author.id, message.url, "Ticket Transfer Started", userSentMessage.id, staffSentMessage.id, true, "At The Mile ModMail")
	
	await (message.channel as TextChannel).setParent(categories[ 0 ].channelId)
}