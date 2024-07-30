import { EmbedBuilder, Message } from "discord.js"
import ModMailPrisma from "../api/ModMail"
import catLogger from "../utils/catloggr"
import { MainTracer } from "../utils/trace"

/**
 * Handles all category creation, listing, editing, and removal.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function categoryFlow(message: Message, traceId: string) {
	try {
	const args = message.content.split(" ")[ 1 ]
		
		switch (args) {
			
			case "list": {
				MainTracer.appendToTrace(traceId, {
					subFlowEntry: "Entered Category List Subflow Handler"
				})
				const categories = (await ModMailPrisma.GET.getCategoryList()).map(e => e.name)
				
				const embed = new EmbedBuilder()
					.setTitle("Category List")
					.setDescription(categories.join("\n"))
					.setColor(0x770202)
					.setFooter({ text: "At The Mile ModMail" })

				catLogger.events("Staff Category Flow Concluded - Category List Generated")
				
				await message.reply({ embeds: [ embed ] })
				MainTracer.appendToTrace(traceId, {
					exitReason: "Gracefully exited Categories Flow"
				})
				MainTracer.closeTrace(traceId, true)
				return
			}
			
			case "create": {
				MainTracer.appendToTrace(traceId, {
					subFlowEntry: "Entered Category Create Subflow Handler"
				})
				const [ id, ...name ] = message.content.split(" ").slice(2)
				
				// Tries to POST a new category, and catches issues with existing categories.
				try {
					await ModMailPrisma.POST.newCategory(id, name.join("-").toLowerCase())
				} catch (e: any) {
					MainTracer.appendToTrace(traceId, {
						exitReason: "Errored inside category creation",
						errorMessage: e.message
					})
					MainTracer.closeTrace(traceId, false)
					return message.reply("Could not add this category. Did you accidentally double up on an existing category's ID?")
				}
				
				const embed = new EmbedBuilder()
					.setTitle("Category Created")
					.setDescription(`Name: **${name.join("-").toLowerCase()}**\nID: \`${id}\``)
					.setColor(0x770202)
					.setFooter({ text: "At The Mile ModMail" })

				catLogger.events("Staff Category Flow Concluded - Category Created")
				
				await message.reply({ embeds: [ embed ] })
				MainTracer.appendToTrace(traceId, {
					exitReason: "Gracefully exited Categories Flow"
				})
				MainTracer.closeTrace(traceId, true)
				return
			}
		}
	} catch (e: any) {
		catLogger.debug("Error occurred within staff category subflow handler:")
        catLogger.debug(e.message)
        MainTracer.appendToTrace(traceId, {
            exitReason: "Catch loop invoked.",
            errorMessage: e.message
        })
        MainTracer.closeTrace(traceId, false)
	}
}