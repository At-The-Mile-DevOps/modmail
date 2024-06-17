import { Message, TextChannel } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import settings from "../settings.json"
import catLogger from "../utils/catloggr";

/**
 * Handles all ticket unclaims.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function unclaimFlow(message: Message) {
	
	const status = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
	if (!status) return await message.reply("This command can only be used in a ticket.")
	
	const ticketObject = await ModMailPrisma.GET.getUserTicketObject(status)
	if (!ticketObject) return await message.reply("This user does not currently have a ticket open.")
	if (!ticketObject.claimedBy || ticketObject.claimedBy != message.author.id) return await message.reply("This ticket isn't claimed by you.")
	
	await ModMailPrisma.PATCH.resetClaimUser(ticketObject.discordId)
	
	await (message.channel as TextChannel).setTopic(`${(message.channel as TextChannel).topic!.split(" | ")[ 0 ]} | Claimed by no one.`)

	catLogger.events("Staff Unclaim Flow Concluded - Ticket Unclaimed")
	
	return message.reply(`Unclaimed ticket. To claim, use ${settings.prefix}claim.`)
}