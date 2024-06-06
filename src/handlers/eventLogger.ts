import { EmbedBuilder, TextBasedChannel } from "discord.js";
import client from "..";
import settings from "../settings.json"
import catLogger from "../utils/catloggr";

export default async function eventLogger(eventType: string, ...eventArgs: any[]) {
	const embed = new EmbedBuilder()
	embed.setColor(0x770202)

	switch (eventType) {
		case "init": {
			catLogger.events(`Client Initialization event emitted.`)
			embed.setTitle("Client Instantiation Complete")
			embed.setDescription("Bot successfully instantiated.")
			break
		}
		case "contact": {
			catLogger.events(`${settings.prefix}contact emitted.`)
			embed.setTitle("Contact Command Used")
			embed.setDescription(`User: <@${eventArgs[0]}> (${eventArgs[0]})\nContacted? \`${eventArgs[1]}\``)
			break
		}
		case "close": {
			catLogger.events(`${settings.prefix}close emitted.`)
			embed.setTitle("Ticket Close Command Used")
			embed.setDescription(`Successful? \`${eventArgs[0]}\`${eventArgs[0] === "true" ? `\nTicket User ID: <@${eventArgs[1]}> (${eventArgs[1]})\nTicket Closer: <@${eventArgs[2]}> (${eventArgs[2]})` : ""}`)
		}
		case "userMessage": {
			catLogger.events(`User Reply event emitted.`)
			embed.setTitle("User Reply Received")
			embed.setDescription(`User: ${eventArgs[0]}`)
		}
	}

	(await (await client.client.guilds.fetch(settings.GUILD_ID)).channels.fetch(settings.log_channel) as TextBasedChannel).send({ embeds: [ embed ] })
}