import { EmbedBuilder, GuildMember } from "discord.js";
import client from "..";
import settings from "../settings.json"

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