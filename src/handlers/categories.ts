import { EmbedBuilder, Message } from "discord.js"
import ModMailPrisma from "../api/ModMail"

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
			await ModMailPrisma.POST.addNewCategory(id, name.join("-").toLowerCase())
			const embed = new EmbedBuilder()
				.setTitle("Category Created")
				.setDescription(`Name: **${name.join("-").toLowerCase()}**\nID: \`${id}\``)
				.setColor(0x770202)
				.setFooter({ text: "At The Mile ModMail" })
			return await message.reply({ embeds: [ embed ] })
		}
	}
}