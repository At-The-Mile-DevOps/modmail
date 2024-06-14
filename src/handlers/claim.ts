import { Message, TextChannel } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import settings from "../settings.json"

export default async function claimFlow(message: Message) {
	const status = await ModMailPrisma.GET.getChannelTicketUser(message.channel.id)
	if (!status) return await message.reply("This command can only be used in a ticket.")
	const ticketObject = await ModMailPrisma.GET.getUserTicketObject(status)
	if (!ticketObject) return await message.reply("This user does not currently have a ticket open.")
	if (ticketObject.claimedBy) return await message.reply("This ticket is already claimed.")
	await ModMailPrisma.PATCH.addClaimUser(status, message.author.id)
	await (message.channel as TextChannel).setTopic(`${(message.channel as TextChannel).topic!.split(" | ")[ 0 ]} | Claimed by ${message.author.displayName}.`)
	return message.reply(`Claimed ticket. To unclaim, use ${settings.prefix}unclaim.`)
}