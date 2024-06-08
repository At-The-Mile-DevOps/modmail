import {Events, Message} from "discord.js";
import settings from "../settings.json"
import ModMailPrisma from "../api/ModMail";
import staffReplyFlow from "../handlers/staffReply";
import anonStaffReplyFlow from "../handlers/staffAnonReply";
import staffContactFlow from "../handlers/staffContact";
import ticketCloseFlow from "../handlers/ticketClose";
import categoryFlow from "../handlers/categories";
import transferFlow from "../handlers/transfer";
import snippetFlow from "../handlers/snippet";
import {Permit} from "../@types/types";

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message: Message) {
		const user = await ModMailPrisma.GET.getUserPermit(message.author.id)
		if (user < Permit.EARLY_ACCESS_STAFF) return await message.reply({ content: "You currently do not have permission to access this ModMail feature." })
		const command = message.content.split(" ")[ 0 ].slice(settings.prefix.length)
		switch (command) {
			case "r":
			case "reply": {
				return await staffReplyFlow(message)
			}
			case "ar":
			case "anonreply": {
				return await anonStaffReplyFlow(message)
			}
			case "contact": {
				return await staffContactFlow(message)
			}
			case "close": {
				return await ticketCloseFlow(message)
			}
			case "categories": {
				return await categoryFlow(message)
			}
			case "transfer": {
				return await transferFlow(message)
			}
			case "snippets": {
				return await snippetFlow(message)
			}
		}
	}
}