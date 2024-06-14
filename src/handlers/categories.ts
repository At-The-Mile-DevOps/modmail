import { EmbedBuilder, Message } from "discord.js"
import ModMailPrisma from "../api/ModMail"

/**
 * Handles all category creation, listing, editing, and removal.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function categoryFlow(message: Message) {
	const args = message.content.split(" ")[ 1 ]
	
	switch (args) {
		
		case "list": {
			const categories = (await ModMailPrisma.GET.getCategoryList()).map(e => e.name)
			
			const embed = new EmbedBuilder()
				.setTitle("Category List")
				.setDescription(categories.join("\n"))
				.setColor(0x770202)
				.setFooter({ text: "At The Mile ModMail" })
			
			return await message.reply({ embeds: [ embed ] })
		}
		
		case "create": {
			const [ id, ...name ] = message.content.split(" ").slice(2)
			
			// Tries to POST a new category, and catches issues with existing categories.
			try {
				await ModMailPrisma.POST.newCategory(id, name.join("-").toLowerCase())
			} catch (e: any) {
				return message.reply("Could not add this category. Did you accidentally double up on an existing category's ID?")
			}
			
			const embed = new EmbedBuilder()
				.setTitle("Category Created")
				.setDescription(`Name: **${name.join("-").toLowerCase()}**\nID: \`${id}\``)
				.setColor(0x770202)
				.setFooter({ text: "At The Mile ModMail" })
			
			return await message.reply({ embeds: [ embed ] })
		}
	}
}