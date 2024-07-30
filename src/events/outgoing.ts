import {ChannelType, Events, Message} from "discord.js";
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
import { MainTracer } from "../utils/trace";
import { v4 as uuidv4 } from "uuid"

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
			catLogger.events(`Locking ratelimiter for ${message.content}`)
			await outgoingRequest(message)
			catLogger.events(`Unlocking ratelimiter for ${message.content}`)
		})
	}
}

async function outgoingRequest(message: Message) {
	if (message.author.bot) return
	if (message.channel.type === ChannelType.DM) return

	const id = uuidv4().slice(0, 8)
	MainTracer.startTrace(id, {
		author: message.author.id,
		message: message.content,
		hasAttachments: (message.attachments.size > 0)
	})
	try {
		const user = await ModMailPrisma.GET.getUserPermit(message.author.id)
		const initialMsg = message.content.split(" ")[ 0 ]

		if (!initialMsg.startsWith(settings.prefix)) {
			MainTracer.appendToTrace(id, {
				exitReason: "Outgoing message does not have prefix."
			})
			MainTracer.closeTrace(id, true)
			return
		}

		

		if (user < Permit.EARLY_ACCESS_STAFF) {
			MainTracer.appendToTrace(id, {
				exitReason: "Inapplicable permit."
			})
			MainTracer.closeTrace(id, true)
			return await message.reply({ content: "You currently do not have permission to access this ModMail feature." })
		}

		const command = message.content.split(" ")[ 0 ].slice(settings.prefix.length)

		switch (command) {

			case "r":
			case "reply": {
				catLogger.events("Staff Reply Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Reply Flow"
				})
				await staffReplyFlow(message, id)
				break
			}

			case "ar":
			case "anonreply": {
				catLogger.events("Staff Anon-Reply Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Anon Reply Flow"
				})
				if (user < Permit.HRM) {
					MainTracer.appendToTrace(id, {
						exitReason: "Inapplicable permit."
					})
					MainTracer.closeTrace(id, true)
					return await message.reply("Only HRM and above can use anonymous replies!")
				}

				await anonStaffReplyFlow(message, id)
				break
			}

			case "contact": {
				catLogger.events("Staff Contact Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Outbound Contact Flow"
				})
				await staffContactFlow(message, id)
				break
			}

			case "close": {
				catLogger.events("Staff Ticket Close Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Ticket Close Flow"
				})
				await ticketCloseFlow(message, id)
				break
			}

			case "categories": {
				catLogger.events("Staff Category Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Category Flow"
				})
				await categoryFlow(message, id)
				break
			}

			case "edit": {
				catLogger.events("Staff Edit Reply Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Edit Reply Flow"
				})
				await staffEditFlow(message, id)
				break
			}

			case "snippets": {
				catLogger.events("Staff Snippets Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Snippets Flow"
				})
				await snippetFlow(message, id)
				break
			}

			case "transfer": {
				catLogger.events("Staff Category Transfer Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Transfer Flow"
				})
				await transferFlow(message, id)
				break
			}

			case "add": {
				catLogger.events("Staff Add User Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Add User Flow"
				})
				await staffAddFlow(message, "add", id)
				break
			}

			case "remove": {
				catLogger.events("Staff Remove User Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Remove User Flow"
				})
				await staffAddFlow(message, "remove", id)
				break
			}

			case "claim": {
				catLogger.events("Staff Claim Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Claim Flow"
				})
				await claimFlow(message, id)
				break
			}

			case "unclaim": {
				catLogger.events("Staff Unclaim Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Unclaim Flow"
				})
				await unclaimFlow(message, id)
				break
			}

			// Triggers for snippets
			default: {
				catLogger.events("Staff Snippet Flow Started")
				MainTracer.appendToTrace(id, {
					receiveResolution: "Entered Staff Used Snippet Flow"
				})
				await useSnippetFlow(message, command, id)
				break
			}
		}
	} catch (e: any) {
		catLogger.debug("Error occurred within incoming message handler:")
        catLogger.debug(e.message)
        MainTracer.appendToTrace(id, {
            exitReason: "Catch loop invoked.",
            errorMessage: e.message
        })
        MainTracer.closeTrace(id, false)
	}
}