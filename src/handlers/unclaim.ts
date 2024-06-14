import { Message, TextChannel } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import settings from "../settings.json"

export default async function unclaimFlow(message: Message) {
	const status = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
	if (!status) return await message.reply("This command can only be used in a ticket.")
	const ticketObject = await ModMailPrisma.GET.getUserTicketObject(status)
	if (!ticketObject) return await message.reply("This user does not currently have a ticket open.")
	if (!ticketObject.claimedBy || ticketObject.claimedBy != message.author.id) return await message.reply("This ticket isn't claimed by you.")
	await ModMailPrisma.PATCH.setClaimUser(status, message.author.id)
	await (message.channel as TextChannel).setTopic(`${(message.channel as TextChannel).topic!.split(" | ")[ 0 ]} | Claimed by no one.`)
	return message.reply(`Unclaimed ticket. To claim, use ${settings.prefix}claim.`)
}