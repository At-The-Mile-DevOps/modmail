import { Message, TextChannel } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import settings from "../settings.json"
import catLogger from "../utils/catloggr";
import { MainTracer } from "../utils/trace";

/**
 * Handles all ticket unclaims.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function unclaimFlow(message: Message, traceId: string) {
	try {
		MainTracer.appendToTrace(traceId, {
			subFlowEntry: "Entered Ticket Unclaim Subflow Handler"
		})
		const status = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
		if (!status) {
			MainTracer.appendToTrace(traceId, {
				exitReason: "No existing ticket"
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
		if (!ticketObject.claimedBy || ticketObject.claimedBy != message.author.id) {
			MainTracer.appendToTrace(traceId, {
				exitReason: "Unclaim not valid for current staff member"
			})
			MainTracer.closeTrace(traceId, true)
			return await message.reply("This ticket isn't claimed by you.")
		}
		
		await ModMailPrisma.PATCH.resetClaimUser(status)

		catLogger.events("Staff Unclaim Flow Concluded - Ticket Unclaimed")
		
		await message.reply(`Unclaimed ticket. To claim, use ${settings.prefix}claim.`)
		MainTracer.appendToTrace(traceId, {
			exitReason: "Gracefully exited Ticket Unclaim handler"
		})
		MainTracer.closeTrace(traceId, true)
	} catch (e: any) {
		catLogger.debug("Error occurred within ticket unclaim subflow handler:")
        catLogger.debug(e.message)
        MainTracer.appendToTrace(traceId, {
            exitReason: "Catch loop invoked.",
            errorMessage: e.message
        })
        MainTracer.closeTrace(traceId, false)
	}
}