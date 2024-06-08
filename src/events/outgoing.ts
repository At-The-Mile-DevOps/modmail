import { AttachmentBuilder, Embed, EmbedBuilder, Events, Message, TextChannel } from "discord.js";
import settings from "../settings.json"
import ModMailPrisma from "../api/ModMail";
import LogEmitter from "../handlers/LogEmitter";
import client from "..";
import newMessageEmbed from "../handlers/newMessageEmbed";
import staffReplyFlow from "../handlers/staffReply";
import anonStaffReplyFlow from "../handlers/staffAnonReply";
import staffContactFlow from "../handlers/staffContact";
import ticketCloseFlow from "../handlers/ticketClose";
import categoryFlow from "../handlers/categories";
import transferFlow from "../handlers/transfer";
import snippetFlow from "../handlers/snippet";

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message: Message) {
		if (message.author.id !== "413462464022446084") return
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