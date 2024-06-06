import client, { prisma } from ".."

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
					discordId
				}
			})
			let printOutput = output.map(entry => `${entry.anon ? "Anonymous" : `${entry.name} (${entry.author})`}: ${entry.content}`)
			printOutput.unshift(`Ticket Transcript for ${discordId}:`)

			return printOutput
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

		public static async createNewSequencedMessage(ticketDiscordId: string, author: string, link: string, content: string, userMsgId: string, staffMsgId: string, anon: boolean, name: string) {
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

			const sequence = (existingSequence ? existingSequence.sequence : 0)

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
					name
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