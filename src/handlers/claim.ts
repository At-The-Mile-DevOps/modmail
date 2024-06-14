import { Message, TextChannel } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import settings from "../settings.json"
import catLogger from "../utils/catloggr";

/**
 * Handles all **claims** (not unclaims!) of a ticket.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function claimFlow(message: Message) {
	
	const status = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
	if (!status) return await message.reply("This command can only be used in a ticket.")
	
	const ticketObject = await ModMailPrisma.GET.getUserTicketObject(status)
	
	if (!ticketObject) return await message.reply("This user does not currently have a ticket open.")
	
	if (ticketObject.claimedBy) return await message.reply("This ticket is already claimed.")
	
	await ModMailPrisma.PATCH.setClaimUser(status, message.author.id)
	
	await (message.channel as TextChannel).setTopic(`${(message.channel as TextChannel).topic!.split(" | ")[ 0 ]} | Claimed by ${message.author.displayName}.`)

	catLogger.events("Staff Claim Flow Concluded - User Claim Swapped")
	
	return message.reply(`Claimed ticket. To unclaim, use ${settings.prefix}unclaim.`)
}