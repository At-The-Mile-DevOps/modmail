import { BannedUsers, Categories, ModMailMessage, ModMailStatus, ModMailUsers, PendingMessages, Snippets } from "@prisma/client";
import { prisma } from ".."
import { Permit } from "../@types/types";
import { v4 as uuidv4 } from "uuid"

/**
 * This is the main driver behind all Prisma operations. 
 * **No Prisma operations should use the raw prisma object, but should instead exclusively use this routing tool.**
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default class ModMailPrisma {

	/**
	 * Nested class for handling all GET (select or narrowed select) related operations.
	 * Most, if not all, operations begin with `is` or `get`.
	 * @author Tyler
	 * @version 0.1
	 * @since 0.1.0
	 */
	public static GET = class {

		/**
		 * Returns whether or not a user has an open ticket. Selects the status, and returns true if the status is not null.
		 * @param discordId The user to search for open tickets from.
		 * @returns `true` if the ticket exists, `false` otherwise. 
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async isUserTicketOpened(discordId: string): Promise<boolean> {
			const status = await prisma.modMailUsers.findMany({
				where: {
					discordId
				}
			})

			return status.length > 0
		}

		/**
		 * Returns the ModMail ticket metadata for a user (non-message components) if they exist, and null otherwise.
		 * @param discordId The user to search for open tickets from.
		 * @returns `ModMailStatus` object if it exists, `null` otherwise.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async getUserTicketObject(discordId: string): Promise<ModMailStatus | null> {
			const mid = await prisma.modMailUsers.findFirst({
				where: {
					discordId
				}
			})

			if (!mid) return null

			return await prisma.modMailStatus.findFirst({
				where: {
					id: mid.modMailStatus
				}
			})
		}

		/**
		 * Returns whether or not the input channel ID is linked to an active ticket.
		 * @param channel The channel ID of the target channel.
		 * @returns `true` if the channel is linked, `false` otherwise.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0 
		 */
		public static async isTicketChannel(channel: string): Promise<boolean> {
			const status = await prisma.modMailStatus.findFirst({
				where: {
					channel
				}
			})

			return status !== null
		}

		/**
		 * Returns the discord ID of the user who's ticket is bound to the input channel, if any.
		 * @param channel The channel ID of the target channel.
		 * @returns The discord ID of the linked user if it exits, and `undefined` otherwise.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async getTicketUserByChannel(channel: string): Promise<string | null> {
			const modmailUsers = await prisma.modMailStatus.findFirst({
				where: {
					channel
				}
			})

			if (!modmailUsers) return null

			const discordUser = await prisma.modMailUsers.findFirst({
				where: {
					modMailStatus: modmailUsers.id
				}
			})
			
			if (!discordUser) return null
			else return discordUser.discordId
		}

		/**
		 * Returns the category channel ID of the target category given the name of the category.
		 * @param name The name of the category.
		 * @returns The category ID if it exists, and `undefined` otherwise.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async getCategoryByName(name: string): Promise<string | null> {
			const channel = await prisma.categories.findFirst({
				where: {
					OR: [
						{
							name
						},
						{
							short: name
						}
					]
				}
			})
			
			if (!channel) return null
			else return channel.channelId
		}

		/**
		 * Returns the full list of categories as Prisma objects.
		 * @returns An array of `Categories`.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async getCategoryList(): Promise<Categories[]> {
			return prisma.categories.findMany()
		}

		/**
		 * Implements a two-part search for categories by loosely-matched names.
		 * 1) The input is compared as a contains LIKE query against the full names of each category.
		 * 2) The input is also compared against the short, qualified names as exact matches that may override nondescript searches.
		 * @param query The input query (name) to search with.
		 * @returns An array of soft and hard matched `Categories` as qualified by the above process.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async getCategoryBySearch(query: string): Promise<Categories[]> {
			return await prisma.categories.findMany({
				where: {
					OR: [
						{
							name: {
								contains: query.toLowerCase()
							}
						},
						{
							short: query
						}
					]
				}
			})
		}

		/**
		 * Prints both the User and Staff copies of a ticket into a transcript. 
		 * Staff copies include hidden messages, or messages in a ticket channel that did not involve bot interaction (discussion).
		 * @param discordId The discord ID of the ticket user.
		 * @returns A `string[][]` where the first returned array is the public copy, and the second is the staff copy.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 * @remarks **Do not confuse this for a print and delete function! The transcript is printed, but the ticket must still be deleted.**
		 */
		public static async printTranscript(discordId: string): Promise<string[][]> {
			const output = await prisma.modMailMessage.findMany({
				where: {
					discordId
				}
			})
			let printOutput = output.filter(e => e.hidden === false).map(entry => `${entry.anon ? "Anonymous" : `${entry.name} (${entry.author})`}: ${entry.content}`)
			printOutput.unshift(`Ticket Transcript for ${discordId}:`)

			const staffOutput = output.map(entry => `${entry.hidden ? "(Hidden Message) " : ""}${entry.anon ? "Anonymous" : `${entry.name} (${entry.author})`}: ${entry.content}`)
			staffOutput.unshift(`Staff Ticket Transcript for ${discordId}:`)

			return [ printOutput, staffOutput ]
		}

		/**
		 * Returns an ephemeral copy of a temporary message - the message is retrieved and deleted before the function releases execution.
		 * Temporary messages are a future way of adding dynamic user interactions.
		 * @param discordId The discord ID of the ticket user using temporary messages.
		 * @returns The first occurrence of a temporary message, after deleting it from the table; if none exists, it returns `null`.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async getTemporaryMessage(discordId: string): Promise<PendingMessages | null> {
			const message = await prisma.pendingMessages.findMany({
				where: {
					discordId
				}
			})

			if (!message[0]) return null
			else {
				await prisma.pendingMessages.delete({
					where: {
						discordId
					}
				})
				return message[0]
			}
		}

		/**
		 * Returns the user's permit level if gated into the system.
		 * @param discordId The discord ID of the user who's permit to search for.
		 * @returns The user's `Permit`, and `Permit.COMMUNITY` (level 0) if no match is found in the gate overrides.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async getUserPermit(discordId: string): Promise<Permit> {
			const user = await prisma.accessGate.findFirst({
				where: {
					user: discordId
				}
			})

			if (!user) return Permit.COMMUNITY
			else return user.permit as Permit
		}

		/**
		 * Returns if a message is found in the database. 
		 * Typically used for edit linking.
		 * @param discordId The discord ID of the ticket user.
		 * @param msgId The message ID to verify.
		 * @returns `true` if the message exists, and `false` otherwise.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async isMessageValid(discordId: string, msgId: string): Promise<boolean> {
			const messages = await prisma.modMailMessage.findFirst({
				where: {
					msgId,
					discordId
				}
			})

			return !(messages === null)
		}

		/**
		 * Returns the full list of available snippets for use.
		 * @returns A `Snippets[]` of the available snippet data.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async getSnippetList(): Promise<Snippets[]> {
			return prisma.snippets.findMany()
		}

		/**
		 * Returns a snippet by name, if it exists in the snippet database.
		 * @param query The snippet name to search for.
		 * @returns A `Snippets` if the snippet can be found, and `null` otherwise.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async getSnippetByName(query: string): Promise<Snippets | null> {
			return prisma.snippets.findFirst({
				where: {
					name: query
				}
			})
		}

		/**
		 * Checks is a ModMail ticket instance is currently marked for scheduled deletion.
		 * @param discordId The discord ID of the ticket user.
		 * @returns The `setTimeout()` ID if the closure is still pending, and `null` otherwise.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async isMarkedForDeletion(discordId: string): Promise<string | null> {
			const id = await prisma.modMailUsers.findFirst({
				select: {
					modMailStatus: true
				},
				where: {
					discordId
				}
			})

			if (!id) return null

			const ticket = await prisma.modMailStatus.findFirst({
				where: {
					id: id.modMailStatus
				}
			})
			if (!ticket) return null
			else return ticket.closeId
		}
	}
	/**
	 * Nested class for handling all POST (create or upsert) related operations.
	 * Most, if not all, operations begin with `new` or `add`.
	 * @author Tyler
	 * @version 0.1
	 * @since 0.1.0
	 */
	public static POST = class {

		/**
		 * Instantiates a new ModMail ticket thread with a target user.
		 * @param discordId The discord ID of the target ticket user.
		 * @param channel The channel to link the ticket to.
		 * @param claimedBy The claiming user, if one exists.
		 * @returns The new ModMail metadata instance as a `ModMailStatus`.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async newModMailThread(discordId: string, channel: string, claimedBy?: string): Promise<ModMailStatus> {
			const status = await prisma.modMailStatus.create({
				data: {
					channel,
					claimedBy,
					claimed: (claimedBy !== null)
				}
			})
			await prisma.modMailUsers.create({
				data: {
					discordId,
					modMailStatus: status.id
				}
			})

			return status
		}

		/**
		 * Instantiates a new sequenced message in the database.
		 * A sequenced message is a message sent during conversation through the ModMail bot. 
		 * The sequence number in question helps maintain organization.
		 * @param ticketDiscordId The discord ID of the ticket user.
		 * @param author The discord ID of the message author.
		 * @param link The URL to the message.
		 * @param content The content of the message.
		 * @param userMsgId The ID of the message that was sent to the user via DMs.
		 * @param staffMsgId The ID of the message that was sent to staff via the ticket channel.
		 * @param anon Whether the message was deemed a normal reply or anonymous reply.
		 * @param name The name of the author. When in anon mode, this does not reveal to the user, but is required for internal tracking.
		 * @param staff Whether the message came from a staff member.
		 * @param hidden Whether the message should be hidden (i.e. not communicated through the bot).
		 * @param image Whether the message is an image attachment.
		 * @returns The new instance of the message as a `ModMailMessage`.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async newSequencedMessage(
			ticketDiscordId: string,
			author: string,
			link: string,
			content: string,
			userMsgId: string,
			staffMsgId: string,
			anon: boolean,
			name: string,
			staff: boolean = false,
			hidden: boolean = false,
			image: boolean = false): Promise<ModMailMessage> {
			const existingSequence = await prisma.modMailMessage.findFirst({
				select: {
					sequence: true
				},
				where: {
					discordId: ticketDiscordId
				},
				orderBy: {
					sequence: 'desc'
				}
			})

			const sequence = (existingSequence ? existingSequence.sequence : 0) + 1

			return await prisma.modMailMessage.create({
				data: {
					discordId: ticketDiscordId,
					author,
					sequence,
					link,
					staffMsgId,
					content,
					msgId: userMsgId,
					anon,
					name,
					staff,
					hidden,
					image
				}
			})
		}

		/**
		 * Instantiates a new temporary message, or message that is deleted upon retrieval.
		 * @param discordId The discord ID of the ticket user.
		 * @param content The content of the temporary message.
		 * @returns The instance of the new message as a `PendingMessages`.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async newTemporaryMessage(discordId: string, content: string): Promise<PendingMessages> {
			return prisma.pendingMessages.create({
				data: {
					discordId,
					content
				}
			})
		}

		/**
		 * Instantiates a new database-linked category channel, used for ticket transfers as a valid destination.
		 * @param id The channel ID of the category.
		 * @param name The full name of the category.
		 * @returns Instance of the new channel as a `Categories`.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 * @remarks This does not allow for short-form naming at this time, and this can only presently be performed by Developers by manually querying the database.
		 */
		public static async newCategory(id: string, name: string): Promise<Categories> {
			return prisma.categories.create({
				data: {
					channelId: id,
					name
				}
			})
		}

		/**
		 * Instantiates a new Snippet into the Snippets database.
		 * @param name The name or trigger word of the snippet.
		 * @param val The text the snippet executes.
		 * @returns The new snippet as a `Snippets` if it was created, and `false` if there was an error.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async newSnippet(name: string, val: string): Promise<Snippets | false> {
			try {
				return prisma.snippets.create({
					data: {
						name,
						val
					}
				})
			} catch (e: any) {
				return false
			}
		}

		/**
		 * Adds a new warning for a user into the Warnings table, and returns the subsequent punishment.
		 * @param discordId The discord ID of the ticket user.
		 * @param reason The reason for the warning.
		 * @returns The related action to take with regards to the new warning count for that user.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 * @beta
		 * @remarks Skeleton code for an upcoming feature.
		 */
		public static async newWarning(discordId: string, reason: string): Promise<"warn" | "7day" | "14day" | "perm"> {
			const id = uuidv4()
			await prisma.warnings.create({
				data: {
					uuid: id,
					discordId,
					reason
				}
			})
			const count = await prisma.warnings.count({
				where: {
					discordId
				}
			})

			if (count < 3) return "warn"
			else if (count === 3) return "7day"
			else if (count === 4) return "14day"
			else return "perm"
		}

		/**
		 * Adds a new ban for a user given some prior warnings.
		 * @param discordId The discord ID of the ticket user.
		 * @returns The new instance of the ban, or `false` if it wasn't created.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 * @beta
		 * @remarks Skeleton code for an upcoming feature.
		 */
		public static async addNewBan(discordId: string): Promise<BannedUsers | false> {
			try {
				return await prisma.bannedUsers.create({
					data: {
						discordId
					}
				})
			} catch (e: any) {
				return false
			}
		}
	}

	/**
	 * Nested class for handling all PATCH (data update) related operations.
	 * Most, if not all, operations begin with `edit` or `set`.
	 * @author Tyler
	 * @version 0.1
	 * @since 0.1.0
	 */
	public static PATCH = class {

		/**
		 * Edits either the latest message (staff) or the target message and linked messages (user).
		 * @param discordId The discord ID of the ticket user.
		 * @param newText The new content to add to the message.
		 * @param msgId The message ID of the referenced message, if performing a user edit.
		 * @returns The updated `ModMailMessage` instance, or `false` if the message could not be updated.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async editMessageContent(discordId: string, ticketUser: string, newText: string, msgId?: string): Promise<ModMailMessage | false> {
			// finds and edits latest (staff)
			if (!msgId) {
				const latest = await prisma.modMailMessage.findFirst({
					where: {
						author: discordId,
						discordId: ticketUser,
						staff: true,
						hidden: false,
						image: false
					},
					orderBy: {
						sequence: "desc"
					}
				})
				if (!latest) return false
				else return prisma.modMailMessage.update({
					where: {
						messageSequenceId: {
							discordId: latest.discordId,
							sequence: latest.sequence
						}
					},
					data: {
						content: newText
					}
				});

				// finds and edits by msgId (user)
			} else {
				const latest = await prisma.modMailMessage.findFirst({
					where: {
						discordId,
						msgId
					}
				})
				if (!latest) return false
				else return prisma.modMailMessage.update({
					where: {
						messageSequenceId: {
							discordId,
							sequence: latest.sequence
						}
					},
					data: {
						content: newText
					}
				});
			}
		}

		/**
		 * Sets a ModMail ticket instance to be marked for scheduled deletion.
		 * @param discordId The discord ID of the ticket user.
		 * @param id The id of the `setTimeout()` function invocation used to delete after a set period of time.
		 * @returns The updated instance as a `ModMailStatus`.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async setForDeletion(discordId: string, id: string): Promise<ModMailStatus | null> {
			const mid = await prisma.modMailUsers.findFirst({
				select: {
					modMailStatus: true
				},
				where: {
					discordId
				}
			})

			if (!mid) return null

			return prisma.modMailStatus.update({
				where: {
					id: mid.modMailStatus
				},
				data: {
					closeId: id
				}
			})
		}

		/**
		 * Edits the content of a snippet.
		 * @param name The name of the snippet to edit.
		 * @param val The value to set the snippet to.
		 * @returns The new snippet as a `Snippets`.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async editSnippetValue(name: string, val: string): Promise<Snippets> {
			return prisma.snippets.update({
				where: {
					name
				},
				data: {
					val
				}
			})
		}

		/**
		 * Undoes a prior deletion mark to cancel scheduled closure.
		 * @param discordId The discord ID of the ticket user.
		 * @returns The updated `ModMailStatus` instance.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async resetDeletion(discordId: string): Promise<ModMailStatus | null> {
			const mid = await prisma.modMailUsers.findFirst({
				select: {
					modMailStatus: true
				},
				where: {
					discordId
				}
			})

			if (!mid) return null

			return prisma.modMailStatus.update({
				where: {
					id: mid.modMailStatus
				},
				data: {
					closeId: null
				}
			})
		}

		/**
		 * Sets the staff member who has claimed a ticket.
		 * @param userDiscordId The discord ID of the ticket user.
		 * @param claimDiscordId The discord ID of the claiming staff member.
		 * @returns The updated instance as a `ModMailStatus`.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async setClaimUser(userDiscordId: string, claimDiscordId: string) {
			const mid = await prisma.modMailUsers.findFirst({
				select: {
					modMailStatus: true
				},
				where: {
					discordId: userDiscordId
				}
			})

			if (!mid) return null

			return prisma.modMailStatus.update({
				where: {
					id: mid.modMailStatus
				},
				data: {
					claimedBy: claimDiscordId
				}
			})
		}

		/**
		 * Undoes a prior claim operation, freeing the ticket for another staff member to claim.
		 * @param userDiscordId The discord ID of the ticket user.
		 * @returns The updated instance as a `ModMailStatus`.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async resetClaimUser(userDiscordId: string) {
			const mid = await prisma.modMailUsers.findFirst({
				select: {
					modMailStatus: true
				},
				where: {
					discordId: userDiscordId
				}
			})

			if (!mid) return null

			return prisma.modMailStatus.update({
				where: {
					id: mid.modMailStatus
				},
				data: {
					claimedBy: null
				}
			})
		}
	}

	/**
	 * Nested class for handling all DELETE (data removal) related operations.
	 * Most, if not all, operations begin with `delete` or `remove`.
	 * @author Tyler
	 * @version 0.1
	 * @since 0.1.0
	 */
	public static DELETE = class {

		/**
		 * Deletes an instance of a ModMail ticket.
		 * @param discordId The discord ID of the ticket user.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async deleteTicket(discordId: string): Promise<void | null> {
			const mid = await prisma.modMailUsers.findFirst({
				select: {
					modMailStatus: true
				},
				where: {
					discordId
				}
			})

			if (!mid) return null

			await prisma.modMailMessage.deleteMany({
				where: {
					discordId
				}
			})
			await prisma.modMailStatus.deleteMany({
				where: {
					id: mid.modMailStatus
				}
			})
			await prisma.modMailUsers.deleteMany({
				where: {
					modMailStatus: mid.modMailStatus
				}
			})
		}

		/**
		 * Deletes an instance of a Snippet.
		 * @param name The name of the snippet to delete.
		 * @returns The deleted snippet as a `Snippets`.
		 * @author Tyler
		 * @version 0.1
		 * @since 0.1.0
		 */
		public static async deleteSnippet(name: string): Promise<Snippets> {
			return prisma.snippets.delete({
				where: {
					name
				}
			})
		}
	}
}