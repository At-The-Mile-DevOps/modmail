import { EmbedBuilder, Message } from "discord.js";
import client from "..";
import settings from "../settings.json"
import ModMailPrisma from "../api/ModMail";
import newMessageEmbed from "./newMessageEmbed";
import catLogger from "../utils/catloggr";
import { MainTracer } from "../utils/trace";

/**
 * Handles all outgoing messages from the contact command.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function staffContactFlow(message: Message, traceId: string) {
	MainTracer.appendToTrace(traceId, {
		subFlowEntry: "Entered Staff Contact Subflow Handler"
	})
	
	try {
		const user = message.content.split(" ")[ 1 ]
		let resolved;
		
		try {
			resolved = await client.client.users.fetch(user)
		
		} catch (e: any) {
			MainTracer.appendToTrace(traceId, {
				exitReason: "Could not resolve target user."
			})
			MainTracer.closeTrace(traceId, false)
			message.reply({ content: "This doesn't seem to be a user that exists. If this is wrong and persists, contact DevOps." })
			return [ user, true ]
		}
		
		let guildResolved;
		
		try {
			guildResolved = await (await client.client.guilds.fetch(settings.GUILD_ID)).members.fetch(user)
		
		} catch (e: any) {
			MainTracer.appendToTrace(traceId, {
				exitReason: "Could not resolve guild user"
			})
			MainTracer.closeTrace(traceId, false)
			message.reply({ content: "Please only use the ModMail system to contact users in the server. If this is wrong and persists, contact DevOps." })
			return [ user, true ]
		}
		
		const status = await ModMailPrisma.GET.isUserTicketOpened(user)
		if (status) {
			MainTracer.appendToTrace(traceId, {
				exitReason: "User has existing ticket"
			})
			MainTracer.closeTrace(traceId, true)		
			message.reply({ content: "This user already has an open ticket! Contact them there." })
		
		} else {
			const channel = await (await client.client.guilds.fetch(settings.GUILD_ID)).channels.create({
				name: `${resolved.username}`,
				topic: `ModMail conversation with ID ${user}`,
				parent: `${await ModMailPrisma.GET.getCategoryByName('pending')}`
			})
			
			await ModMailPrisma.POST.newModMailThread(user, channel.id, message.author.id)
			
			const embed = new EmbedBuilder()
				.setTitle("New Modmail Thread Created")
				.setDescription("A member of At The Mile Logistics staff has contacted you via the ModMail messaging system. Please be patient, but feel free to reply if you hear no response soon.")
				.setColor(0x770202)
				.setFooter({ text: "At The Mile ModMail" })
			
			const userMsg = await resolved.send({ embeds: [ embed ] })
			
			await channel.send({ embeds: [ await newMessageEmbed(guildResolved) ] })
			
			const staffMsg = await channel.send({ content: "The following embed was sent to the user.", embeds: [ embed ] })
			
			await ModMailPrisma.POST.newSequencedMessage(user, message.author.id, staffMsg.url, "Contact ticket instantiated by member of staff.", userMsg.id, staffMsg.id, true, "At The Mile ModMail")

			catLogger.events("Staff Contact Flow Concluded - User Contacted")
			
			message.reply({ content: `Ticket created! See <#${channel.id}> for your ticket.` })
		}
			MainTracer.appendToTrace(traceId, {
				exitReason: "Gracefully exited Staff Contact flow"
			})
			MainTracer.closeTrace(traceId, true)
		return [ user, status ]
	} catch (e: any) {
		catLogger.debug("Error occurred within staff contact flow handler:")
		catLogger.debug(e.message)
		MainTracer.appendToTrace(traceId, {
			exitReason: "Catch loop invoked.",
			errorMessage: e.message
		})
		MainTracer.closeTrace(traceId, false)
	}
}