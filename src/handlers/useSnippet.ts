import { EmbedBuilder, Message } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import client from "..";
import catLogger from "../utils/catloggr";
import { MainTracer } from "../utils/trace";

/**
 * Handles all instances of attempted use of snippets.
 * @param message The message from the `outgoing.ts` listener.
 * @param command The command as segmented out from the content in the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function useSnippetFlow(message: Message, command: string, traceId: string) {
	try {
		MainTracer.appendToTrace(traceId, {
			subFlowEntry: "Entered Use Snippet Subflow Handler"
		})
		const snippet = await ModMailPrisma.GET.getSnippetByName(command)
		if (!snippet) {
			MainTracer.appendToTrace(traceId, {
				exitReason: "No matching snippet"
			})
			MainTracer.closeTrace(traceId, true)
			return
		}
		
		const user = await ModMailPrisma.GET.getTicketUserByChannel(message.channel.id)
		if (!user) {
			MainTracer.appendToTrace(traceId, {
				exitReason: "No existing ticket"
			})
			MainTracer.closeTrace(traceId, true)
			return
		}
		
		if (snippet.val.match("{r}")) {
			
			if (message.content.split(" ").slice(1).join(" ").length === 0) {
				MainTracer.appendToTrace(traceId, {
					exitReason: "No reason provided when required"
				})
				MainTracer.closeTrace(traceId, true)
				return await message.reply("This snippet requires a reason.")
			}
			
			else snippet.val = snippet.val.replace("{r}", message.content.split(" ").slice(1).join(" "))
		}
		
		snippet.val = snippet.val.replace("{a}", `<@${message.author.id}>`)
		
		snippet.val = snippet.val.replace("{u}", `<@${user}>`)
		
		const status = await ModMailPrisma.GET.isMarkedForDeletion(user)
		
		if (status) {
			
			clearTimeout(status)
			MainTracer.appendToTrace(traceId, {
				cancelledDeletion: true
			})
			const embed = new EmbedBuilder()
				.setTitle("Close Cancelled")
				.setDescription("Scheduled close cancelled.")
				.setColor(0x770202)
				.setFooter({ text: "At The Mile ModMail" })

			await message.reply({
				embeds: [ embed ]
			})
			
			await ModMailPrisma.PATCH.resetDeletion(user)
		}
		
		const content = message.content.split(" ")
		content.shift()
		
		const staffMember = message.member!
		
		const embed = new EmbedBuilder()
			.setDescription(snippet.val)
			.setAuthor({ name: message.member?.displayName ?? message.author.username, iconURL: message.author.avatarURL() ?? undefined })
			.setFooter({ text: staffMember.roles.highest.name })
			.setColor(0x770202)
		
		const replyUser = await client.client.users.fetch(user)
		
		const userSentMessage = await replyUser.send({ embeds: [ embed ] })
		
		await message.delete()
		
		const staffSentMessage = await message.channel.send({ embeds: [ embed ] })

		catLogger.events("Staff Snippet Flow Concluded - Snippet Reply Sent")

		await ModMailPrisma.POST.newSequencedMessage(user, message.author.id, message.url, content.join(" "), userSentMessage.id, staffSentMessage.id, false, staffMember.displayName, true)

		MainTracer.appendToTrace(traceId, {
			exitReason: "Gracefully exited Use Snippet handler"
		})
		MainTracer.closeTrace(traceId, true)
		return
	} catch (e: any) {
		catLogger.debug("Error occurred within use snippet subflow handler:")
        catLogger.debug(e.message)
        MainTracer.appendToTrace(traceId, {
            exitReason: "Catch loop invoked.",
            errorMessage: e.message
        })
        MainTracer.closeTrace(traceId, false)
	}
}