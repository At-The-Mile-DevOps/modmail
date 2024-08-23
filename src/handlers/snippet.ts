import { EmbedBuilder, Message } from "discord.js";
import ModMailPrisma from "../api/ModMail";
import settings from "../settings.json"
import RESERVED_SNIPPET_NAMES from "../utils/reservedWords";
import { Permit } from "../@types/types";
import catLogger from "../utils/catloggr";
import { MainTracer } from "../utils/trace";

/**
 * Handles the creation, editing, and deletion of snippets.
 * @param message The message from the `outgoing.ts` listener.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function snippetFlow(message: Message, traceId: string) {
   try {
    const args = message.content.split(" ")[ 1 ]
    
    switch (args) {
        
        case "new": {
            MainTracer.appendToTrace(traceId, {
                subFlowEntry: "Entered Snippet New Subflow Handler"
            })
            const permit = await ModMailPrisma.GET.getUserPermit(message.author.id)
            if (permit < Permit.HRM) {
                MainTracer.appendToTrace(traceId, {
                    exitReason: "Inapplicable permit."
                })
                MainTracer.closeTrace(traceId, true)
                return await message.reply("Only HRM+ can create, edit, and delete snippets.")
            }
            const name = message.content.split(" ")[ 2 ]
            let val = message.content.split(" ").slice(3).join(" ")
           
            let oldVal = val
            
            if (RESERVED_SNIPPET_NAMES.includes(name)) {
                MainTracer.appendToTrace(traceId, {
                    exitReason: "Reserved snippet name attempted"
                })
                MainTracer.closeTrace(traceId, true)
                return await message.reply("This name is reserved for something else. Please use a different name.")
            }

            let additionalDesc = ""
            let userSubMatches = val.match(/{u}/g)
            
            if (userSubMatches) {
                if (userSubMatches.length > 1) {
                    MainTracer.appendToTrace(traceId, {
                        exitReason: "Incompatible user replacements"
                    })
                    MainTracer.closeTrace(traceId, true)
                    return await message.reply("You can only use one user replacement per snippet.")
                }
                additionalDesc += `This snippet has a user mention substitution.\n`
                val = val.replace("{u}", `<@${settings.CLIENT_ID}>`)
            }

            let authorSubMatches = val.match(/{a}/g)
            
            if (authorSubMatches) {
                if (authorSubMatches.length > 1) {
                    MainTracer.appendToTrace(traceId, {
                        exitReason: "Incompatible author replacements"
                    })
                    MainTracer.closeTrace(traceId, true)
                    return await message.reply("You can only use one author replacement per snippet.")
                }
                additionalDesc += `This snippet has an author mention substitution.\n`
                val = val.replace("{a}", `<@${message.author.id}>`)
            }

            let reasonSubMatches = val.match(/{r}/g)
            
            if (reasonSubMatches) {
                if (reasonSubMatches.length > 1) {
                    MainTracer.appendToTrace(traceId, {
                        exitReason: "Incompatible reason replacements"
                    })
                    MainTracer.closeTrace(traceId, true)
                    return await message.reply("You can only use one reason replacement per snippet.")
                }
                additionalDesc += `This snippet has a reason substitution.\n`
                val = val.replace("{r}", `This is a sample reason.`)
            }

            const status = await ModMailPrisma.POST.newSnippet(name, oldVal)
            if (status === false) {
                MainTracer.appendToTrace(traceId, {
                    exitReason: "Existing snippet"
                })
                MainTracer.closeTrace(traceId, true)
                return await message.reply({ content: "A snippet with that name already exists. Please use the edit command if you want to change the value." })
            }

            additionalDesc += "\n\n"
           
            const embed = new EmbedBuilder()
                .setTitle(`New Snippet Created - ${settings.prefix}${name}`)
                .setColor(0x770202)
                .setFooter({ text: `At The Mile ModMail | To edit, use ${settings.prefix}snippets edit ${name}.` })
                .setDescription(`${additionalDesc}Sample Output:\n${val}`)

            catLogger.events("Staff Snippet Flow Concluded - New Snippet Generated")
            
            await message.reply({
                embeds: [ embed ]
            })
            MainTracer.appendToTrace(traceId, {
                exitReason: "Gracefully exited Snippet Add Flow"
            })
            MainTracer.closeTrace(traceId, true)
            return
        }
        
        case "edit": {
            MainTracer.appendToTrace(traceId, {
                subFlowEntry: "Entered Snippet Edit Subflow Handler"
            })
            const permit = await ModMailPrisma.GET.getUserPermit(message.author.id)
            if (permit < Permit.HRM) {
                MainTracer.appendToTrace(traceId, {
                    exitReason: "Inapplicable permit."
                })
                MainTracer.closeTrace(traceId, true)
                return await message.reply("Only HRM+ can create, edit, and delete snippets.")
            }
            const name = message.content.split(" ")[ 2 ]
            let val = message.content.split(" ").slice(3).join(" ")
            
            let oldVal = val
            
            const snippet = await ModMailPrisma.GET.getSnippetByName(name)
            if (!snippet) {
                MainTracer.appendToTrace(traceId, {
                    exitReason: "No existing snippet to edit"
                })
                MainTracer.closeTrace(traceId, true)
                return await message.reply("This doesn't seem to be a snippet.")
            }

            let additionalDesc = ""
            let userSubMatches = val.match(/{u}/g)
           
            if (userSubMatches) {
                if (userSubMatches.length > 1) {
                    MainTracer.appendToTrace(traceId, {
                        exitReason: "Incompatible user replacements"
                    })
                    MainTracer.closeTrace(traceId, true)
                    return await message.reply("You can only use one user replacement per snippet.")
                }
                additionalDesc += `This snippet has a user mention substitution.\n`
                val = val.replace("{u}", `<@${settings.CLIENT_ID}>`)
            }

            let authorSubMatches = val.match(/{a}/g)
            if (authorSubMatches) {
                if (authorSubMatches.length > 1) {
                    MainTracer.appendToTrace(traceId, {
                        exitReason: "Incompatible author replacements"
                    })
                    MainTracer.closeTrace(traceId, true)
                    return await message.reply("You can only use one author replacement per snippet.")
                }
                additionalDesc += `This snippet has an author mention substitution.\n`
                val = val.replace("{a}", `<@${message.author.id}>`)
            }

            let reasonSubMatches = val.match(/{r}/g)
            if (reasonSubMatches) {
                if (reasonSubMatches.length > 1) {
                    MainTracer.appendToTrace(traceId, {
                        exitReason: "Incompatible reason replacements"
                    })
                    MainTracer.closeTrace(traceId, true)
                    return await message.reply("You can only use one reason replacement per snippet.")
                }
                additionalDesc += `This snippet has a reason substitution.\n`
                val = val.replace("{r}", `This is a sample reason.`)
            }

            await ModMailPrisma.PATCH.editSnippetValue(name, oldVal)

            const embed = new EmbedBuilder()
                .setTitle(`Snippet Edited`)
                .setColor(0x770202)
                .setFooter({ text: `At The Mile ModMail | To edit, use ${settings.prefix}snippets edit ${name}.` })
                .setDescription(`${additionalDesc}Sample Output:\n${val}`)

            catLogger.events("Staff Snippet Flow Concluded - Snippet Edited")

            await message.reply({
                embeds: [ embed ]
            })
            MainTracer.appendToTrace(traceId, {
                exitReason: "Gracefully exited Snippet Add Flow"
            })
            MainTracer.closeTrace(traceId, true)
            return
        }
        
        case "delete": {
            MainTracer.appendToTrace(traceId, {
                subFlowEntry: "Entered Snippet Delete Subflow Handler"
            })
            const permit = await ModMailPrisma.GET.getUserPermit(message.author.id)
            if (permit < Permit.HRM) {
                MainTracer.appendToTrace(traceId, {
                    exitReason: "Inapplicable permit."
                })
                MainTracer.closeTrace(traceId, true)
                return await message.reply("Only HRM+ can create, edit, and delete snippets.")
            }
            const name = message.content.split(" ")[ 2 ]
            
            const snippet = await ModMailPrisma.GET.getSnippetByName(name)
            if (!snippet) {
                MainTracer.appendToTrace(traceId, {
                    exitReason: "No existing snippet to edit"
                })
                MainTracer.closeTrace(traceId, true)
                return await message.reply("This doesn't seem to be a snippet.")
            }
            
            await ModMailPrisma.DELETE.deleteSnippet(name)

            catLogger.events("Staff Snippet Flow Concluded - Snippet Deleted")
            
            await message.reply("Snippet deleted.")
            MainTracer.appendToTrace(traceId, {
                exitReason: "Gracefully exited Snippet Delete Flow"
            })
            MainTracer.closeTrace(traceId, true)
            return
        }
        
        default: {
            if (!args) {
                MainTracer.appendToTrace(traceId, {
                    subFlowEntry: "Entered Snippet Command Preview Subflow Handler"
                })
                const snippets = (await ModMailPrisma.GET.getSnippetList()).map(e => e.name)
                const embed = new EmbedBuilder()
                    .setTitle("Available Snippets")
                    .setColor(0x770202)
                    .setFooter({ text: "At The Mile ModMail" })
                    .setDescription(`To run a snippet in a ticket, run \`${settings.prefix}[name]\`.\nTo preview a snippet, run \`${settings.prefix}snippets [name]\`.\n\n${snippets.join("\n")}`)

                catLogger.events("Staff Snippet Flow Concluded - Snippet Info Menu Generated")

                await message.reply({
                    embeds: [ embed ]
                })
                MainTracer.appendToTrace(traceId, {
                    exitReason: "Gracefully exited Snippet Command Preview Flow"
                })
                MainTracer.closeTrace(traceId, true)
                return
            } else {
                MainTracer.appendToTrace(traceId, {
                    subFlowEntry: "Entered Snippet Preview Subflow Handler"
                })
                const snippet = await ModMailPrisma.GET.getSnippetByName(args)
                if (!snippet) return await message.reply("This doesn't seem to be a snippet.")
                
                const embed = new EmbedBuilder()
                    .setTitle(`Snippet ${settings.prefix}${snippet.name}`)
                    .setColor(0x770202)
                    .setFooter({ text: "At The Mile ModMail" })
                    .setDescription(snippet.val)

                catLogger.events("Staff Snippet Flow Concluded - Snippet Previewed")

                await message.reply({
                    embeds: [ embed ]
                })
                MainTracer.appendToTrace(traceId, {
                    exitReason: "Gracefully exited Snippet Preview Flow"
                })
                MainTracer.closeTrace(traceId, true)
            }
        }
    }
   } catch (e: any) {
    catLogger.debug("Error occurred within snippet flow handler:")
    catLogger.debug(e.message)
    MainTracer.appendToTrace(traceId, {
        exitReason: "Catch loop invoked.",
        errorMessage: e.message
    })
    MainTracer.closeTrace(traceId, false)
   }
}