import { EmbedBuilder, Message } from "discord.js";
import client from "..";
import settings from "../settings.json"
import ModMailPrisma from "../api/ModMail";
import newMessageEmbed from "./newMessageEmbed";

export default async function staffContactFlow(message: Message) {
	const user = message.content.split(" ")[ 1 ]
	let resolved;
	try {
		resolved = await client.client.users.fetch(user)
	} catch (e: any) {
		message.reply({ content: "This doesn't seem to be a user that exists. If this is wrong and persists, contact DevOps." })
		return [user, true]
	}
	let guildResolved;
	try {
		guildResolved = await (await client.client.guilds.fetch(settings.GUILD_ID)).members.fetch(user)
	} catch (e: any) {
		message.reply({ content: "Please only use the ModMail system to contact users in the server. If this is wrong and persists, contact DevOps." })
		return [user, true]
	}
	const status = await ModMailPrisma.GET.getUserTicketStatus(user)
	if (status) {
		message.reply({ content: "This user already has an open ticket! Contact them there." })
	} else {
		const channel = await (await client.client.guilds.fetch(settings.GUILD_ID)).channels.create({
			name: `pending-${resolved.username}`,
			topic: `ModMail conversation with ID ${user} | Claimed by ${message.author.displayName}.`,
			parent: `${await ModMailPrisma.GET.getCategoryByName('pending')}`
		})
		await ModMailPrisma.POST.createNewModmailThread(user, channel.id, message.author.id)
		const embed = new EmbedBuilder()
			.setTitle("New Modmail Thread Created")
			.setDescription("A member of At The Mile Logistics staff has contacted you via the ModMail messaging system. Please be patient, but feel free to reply if you hear no response soon.")
			.setColor(0x770202)
			.setFooter({ text: "At The Mile ModMail" })
		const userMsg = await resolved.send({ embeds: [ embed ] })
		await channel.send({ embeds: [ await newMessageEmbed(guildResolved) ] })
		const staffMsg = await channel.send({ content: "The following embed was sent to the user.", embeds: [ embed ] })
		await ModMailPrisma.POST.createNewSequencedMessage(user, message.author.id, staffMsg.url, "Contact ticket instantiated by member of staff.", userMsg.id, staffMsg.id, true, "At The Mile ModMail")
		message.reply({ content: `Ticket created! See <#${channel.id}> for your ticket.` })
	}
	return [user, status]
}