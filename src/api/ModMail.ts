import client, { prisma } from ".."
import {Permit} from "../@types/types";

export default class ModMailPrisma {
	public static GET = class {
		public static async getUserTicketStatus(discordId: string) {
			const status = await prisma.modMailStatus.findFirst({
				where: {
					discordId
				}
			})

			return status != null
		}

		public static async getUserTicketObject(discordId: string) {
			const status = await prisma.modMailStatus.findFirst({
				where: {
					discordId
				}
			})

			return status
		}

		public static async getChannelTicketStatus(channel: string) {
			const status = await prisma.modMailStatus.findFirst({
				where: {
					channel
				}
			})

			return status != null
		}

		public static async getChannelTicketUser(channel: string) {
			const status = await prisma.modMailStatus.findFirst({
				where: {
					channel
				}
			})

			return status?.discordId
		}

		public static async getCategoryByName(name: string) {
			return (await prisma.categories.findFirst({
				where: {
					name
				}
			}))?.channelId
		}

		public static async getCategoryList() {
			return prisma.categories.findMany()
		}

		public static async printTranscript(discordId: string) {
			const output = await prisma.modMailMessage.findMany({
				where: {
					discordId,
					hidden: false
				}
			})
			let printOutput = output.map(entry => `${entry.anon ? "Anonymous" : `${entry.name} (${entry.author})`}: ${entry.content}`)
			printOutput.unshift(`Ticket Transcript for ${discordId}:`)

			const staffQuery = await prisma.modMailMessage.findMany({
				where: {
					discordId
				}
			})

			const staffOutput = staffQuery.map(entry => `${entry.hidden ? "(Hidden Message) " : ""}${entry.anon ? "Anonymous" : `${entry.name} (${entry.author})`}: ${entry.content}`)
			staffOutput.unshift(`Staff Ticket Transcript for ${discordId}:`)

			return [printOutput, staffOutput]
		}

		public static async getTemporaryMessage(discordId: string) {
			const message = await prisma.pendingMessages.findFirst({
				where: {
					discordId
				}
			})

			if (!message) return null
			else {
				await prisma.pendingMessages.delete({
					where: {
						discordId
					}
				})
				return message
			}
		}

		public static async getUserPermit(discordId: string): Promise<Permit> {
			const user = await prisma.accessGate.findFirst({
				where: {
					user: discordId
				}
			})

			if (!user) return Permit.COMMUNITY
			else return user.permit as Permit
		}

		public static async checkIfMessageValid(discordId: string, msgId: string) {
			const messages = await prisma.modMailMessage.findFirst({
				where: {
					msgId,
					discordId
				}
			})

			return !(messages === null)
		}
	}
	public static POST = class {
		public static async createNewModmailThread(discordId: string, channel: string, claimedBy?: string) {
			return prisma.modMailStatus.create({
				data: {
					discordId,
					channel,
					claimedBy,
					claimed: (claimedBy !== null)
				}
			})
		}

		public static async createNewSequencedMessage(
			ticketDiscordId: string,
			author: string,
			link: string,
			content: string,
			userMsgId: string,
			staffMsgId: string,
			anon: boolean,
			name: string,
			staff: boolean = false,
			hidden: boolean = false) {
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

			await prisma.modMailMessage.create({
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
					hidden
				}
			})
		}

		public static async addTemporaryMessage(discordId: string, content: string) {
			return prisma.pendingMessages.create({
				data: {
					discordId,
					content
				}
			})
		}

		public static async addNewCategory(id: string, name: string) {
			return prisma.categories.create({
				data: {
					channelId: id,
					name
				}
			})
		}

		public static async addNewSnippet(name: string, val: string) {
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
	}

	public static PATCH = class {
		public static async updateMessageContent(discordId: string, newText: string, msgId?: string) {
			// finds and edits latest (staff)
			if (!msgId) {
				const latest = await prisma.modMailMessage.findFirst({
					where: {
						author: discordId,
						staff: true,
						hidden: false
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
	}

	public static DELETE = class {
		public static async removeTicket(discordId: string) {
			await prisma.modMailMessage.deleteMany({
				where: {
					discordId
				}
			})

			await prisma.modMailStatus.deleteMany({
				where: {
					discordId
				}
			})
		}
	}
}