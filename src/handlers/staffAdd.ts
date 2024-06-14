import {Message, TextChannel} from "discord.js";
import client from "../index";
import ModMailPrisma from "../api/ModMail";
import {Permit} from "../@types/types";

/**
 * Handles staff additions and removal from a ticket.
 * @param message The message from the `outgoing.ts` listener.
 * @param mode Whether to add or remove a user from a ticket.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function staffAddFlow(message: Message, mode: "add" | "remove") {
    
    if (mode === "add") {
        const targetId = message.content.split(" ")[1]
        
        const permit = await ModMailPrisma.GET.getUserPermit(targetId)
        if (permit == Permit.COMMUNITY) return await message.reply("This user does not have staff permissions, and as such cannot be added.")
        
        try {
            const user = await client.client.users.fetch(targetId);
           
            await (message.channel as TextChannel).permissionOverwrites.create(targetId, {
                ViewChannel: true,
                SendMessages: true
            })
            
            return await message.reply(`Added <@${targetId}> to the ticket.`)
        
        } catch (e: any) {
            return await message.reply("Could not add the requested user.")
        }
    
    } else {
        const targetId = message.content.split(" ")[1]
        
        try {
            const user = await client.client.users.fetch(targetId);
            await (message.channel as TextChannel).permissionOverwrites.create(targetId, {
                ViewChannel: false,
                SendMessages: false
            })
            return await message.reply(`Removed <@${targetId}> from the ticket.`)
        
        } catch (e: any) {
            return await message.reply("Could not remove the requested user.")
        }
    }
}