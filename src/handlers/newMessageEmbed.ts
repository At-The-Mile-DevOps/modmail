import { EmbedBuilder, GuildMember } from "discord.js";

/**
 * Easy way to create introductory embeds for new staff ticket channels.
 * @param guildUser The user to create the ticket for.
 * @author Tyler
 * @version 0.1
 * @since 0.1.0
 */
export default async function newMessageEmbed(guildUser: GuildMember) {
	const roles: string[] = []
	guildUser.roles.cache.sort((r1, r2) => r2.position - r1.position).each(r => roles.push(r.name))
	
	const embed = new EmbedBuilder()
		.setTitle("New ModMail Thread")
		.setDescription(`<@${guildUser.id}> (${guildUser.displayName}) has been a member of ATM since <t:${Math.floor(guildUser.joinedTimestamp! / 1000)}:R>.\nRoles: ${roles.join(", ")}`)
		.setColor(0x770202)
		.setFooter({ text: "At The Mile ModMail" })

	return embed
}