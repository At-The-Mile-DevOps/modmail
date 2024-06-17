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
import {Permit, rateLimit} from "../@types/types";
import staffEditFlow from "../handlers/staffEdit";
import staffAddFlow from "../handlers/staffAdd";
import useSnippetFlow from "../handlers/useSnippet";
import claimFlow from "../handlers/claim";
import unclaimFlow from "../handlers/unclaim";
import catLogger from "../utils/catloggr";

/**
 * The core driver for all staff functionality. Handles all ticket channel commands.
 * Use functional flows when adding new commands to keep files minimal in size.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message: Message) {
		rateLimit.use(async () => {
			await outgoingRequest(message)
		})
	}
}

async function outgoingRequest(message: Message) {
	const user = await ModMailPrisma.GET.getUserPermit(message.author.id)
	const initialMsg = message.content.split(" ")[ 0 ]

	if (!initialMsg.startsWith(settings.prefix)) return

	if (message.author.bot) return

	if (user < Permit.EARLY_ACCESS_STAFF) return await message.reply({ content: "You currently do not have permission to access this ModMail feature." })

	const command = message.content.split(" ")[ 0 ].slice(settings.prefix.length)

	switch (command) {

		case "r":
		case "reply": {
			catLogger.events("Staff Reply Flow Started")
			return await staffReplyFlow(message)
		}

		case "ar":
		case "anonreply": {
			catLogger.events("Staff Anon-Reply Flow Started")
			if (user < Permit.HRM) return await message.reply("Only HRM and above can use anonymous replies!")

			return await anonStaffReplyFlow(message)
		}

		case "contact": {
			catLogger.events("Staff Contact Flow Started")
			return await staffContactFlow(message)
		}

		case "close": {
			catLogger.events("Staff Ticket Close Flow Started")
			return await ticketCloseFlow(message)
		}

		case "categories": {
			catLogger.events("Staff Category Flow Started")
			return await categoryFlow(message)
		}

		case "edit": {
			catLogger.events("Staff Edit Reply Flow Started")
			return await staffEditFlow(message)
		}

		case "snippets": {
			catLogger.events("Staff Snippets Flow Started")
			return await snippetFlow(message)
		}

		case "transfer": {
			catLogger.events("Staff Category Transfer Flow Started")
			return await transferFlow(message)
		}

		case "add": {
			catLogger.events("Staff Add User Flow Started")
			return await staffAddFlow(message, "add")
		}

		case "remove": {
			catLogger.events("Staff Remove User Flow Started")
			return await staffAddFlow(message, "remove")
		}

		case "claim": {
			catLogger.events("Staff Claim Flow Started")
			return await claimFlow(message)
		}

		case "unclaim": {
			catLogger.events("Staff Unclaim Flow Started")
			return await unclaimFlow(message)
		}

		// Triggers for snippets
		default: {
			catLogger.events("Staff Snippet Flow Started")
			return await useSnippetFlow(message, command)
		}
	}
}