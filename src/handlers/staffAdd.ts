import {Message, TextChannel} from "discord.js";
import client from "../index";
import ModMailPrisma from "../api/ModMail";
import {Permit} from "../@types/types";
import catLogger from "../utils/catloggr";
import { MainTracer } from "../utils/trace";

/**
 * Handles staff additions and removal from a ticket.
 * @param message The message from the `outgoing.ts` listener.
 * @param mode Whether to add or remove a user from a ticket.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function staffAddFlow(message: Message, mode: "add" | "remove", traceId: string) {
    if (mode === "add") {
        try {
            MainTracer.appendToTrace(traceId, {
                subFlowEntry: "Entered Staff Add Subflow Handler"
            })
            const targetId = message.content.split(" ")[1]
            
            const permit = await ModMailPrisma.GET.getUserPermit(targetId)
            if (permit == Permit.COMMUNITY) {
                MainTracer.appendToTrace(traceId, {
                    exitReason: "Incompatible target permit"
                })
                MainTracer.closeTrace(traceId, true)
                return await message.reply("This user does not have staff permissions, and as such cannot be added.")
            }
            const user = await client.client.users.fetch(targetId);
           
            await (message.channel as TextChannel).permissionOverwrites.create(targetId, {
                ViewChannel: true,
                SendMessages: true
            })
            
            catLogger.events("Staff Add User Flow Concluded - User Added To Ticket")
            
            await message.reply(`Added <@${targetId}> to the ticket.`)
            MainTracer.appendToTrace(traceId, {
                exitReason: "Gracefully exited Staff Add Flow"
            })
            MainTracer.closeTrace(traceId, true)
            return
        
        } catch (e: any) {
            catLogger.debug("Error occurred within staff add flow handler:")
            catLogger.debug(e.message)
            MainTracer.appendToTrace(traceId, {
                exitReason: "Catch loop invoked.",
                errorMessage: e.message
            })
            MainTracer.closeTrace(traceId, false)
            return await message.reply("Could not add the requested user.")
        }
    
    } else {
        const targetId = message.content.split(" ")[1]
        
        try {
            const user = await client.client.users.fetch(targetId);
            await (message.channel as TextChannel).permissionOverwrites.delete(user, "Override permissions removed.")
            catLogger.events("Staff Remove User Flow Concluded - User Removed From Ticket")

            await message.reply(`Removed <@${targetId}> from the ticket.`)
            MainTracer.appendToTrace(traceId, {
                exitReason: "Gracefully exited Staff Add Flow"
            })
            MainTracer.closeTrace(traceId, true)
        
        } catch (e: any) {
            catLogger.debug("Error occurred within staff remove flow handler:")
            catLogger.debug(e.message)
            MainTracer.appendToTrace(traceId, {
                exitReason: "Catch loop invoked.",
                errorMessage: e.message
            })
            MainTracer.closeTrace(traceId, false)
            return await message.reply("Could not remove the requested user.")
        }
    }
}