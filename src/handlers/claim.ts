import { Message, TextChannel } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import settings from "../settings.json"
import catLogger from "../utils/catloggr";
import { MainTracer } from "../utils/trace";

/**
 * Handles all **claims** (not unclaims!) of a ticket.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function claimFlow(message: Message, traceId: string) {
	MainTracer.appendToTrace(traceId, {
		subFlowEntry: "Entered Staff Claim Subflow Handler"
	})
	try {
		const status = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
		if (!status) {
			MainTracer.appendToTrace(traceId, {
				exitReason: "No existing ModMail status"
			})
			MainTracer.closeTrace(traceId, true)
			return await message.reply("This command can only be used in a ticket.")
		}
		
		const ticketObject = await ModMailPrisma.GET.getUserTicketObject(status)
		
		if (!ticketObject) {
			MainTracer.appendToTrace(traceId, {
				exitReason: "No existing ticket"
			})
			MainTracer.closeTrace(traceId, true)
			return await message.reply("This user does not currently have a ticket open.")
		}
		
		if (ticketObject.claimedBy) {
			MainTracer.appendToTrace(traceId, {
				exitReason: "Ticket already claimed"
			})
			MainTracer.closeTrace(traceId, true)
			return await message.reply("This ticket is already claimed.")
		}
		
		await ModMailPrisma.PATCH.setClaimUser(status, message.author.id)

		catLogger.events("Staff Claim Flow Concluded - User Claim Swapped")
		
		await message.reply(`Claimed ticket. To unclaim, use ${settings.prefix}unclaim.`)
		MainTracer.appendToTrace(traceId, {
			exitReason: "Gracefully exited Categories Flow"
		})
		MainTracer.closeTrace(traceId, true)
		return
	} catch (e: any) {
		catLogger.debug("Error occurred within staff claim subflow handler:")
        catLogger.debug(e.message)
        MainTracer.appendToTrace(traceId, {
            exitReason: "Catch loop invoked.",
            errorMessage: e.message
        })
        MainTracer.closeTrace(traceId, false)
	}
}