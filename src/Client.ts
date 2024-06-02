import path from "path";
import { ExtendedClient } from "./@types/types";
import { ActivityType, Client, Collection, GatewayIntentBits, Partials, REST, Routes } from "discord.js";
import fs from "fs"
import catLogger from "./utils/catloggr";

/**
 * Class for the Discord.JS client instantiation of the bot.
 * @since 0.1.0
 * @author Tyler
 */
export default class ModMailClient {
	// Token as accessed via a secure `.env.prod` file.
	private readonly token;

	// ClientId of the Discord bot instantiation. Set in `settings.json`.
	public readonly clientId;

	// Also set in `settings.json` - easter egg that shows when the bot is being actively worked on. Changes status to DND and changes the custom activity.
	private readonly dev;

	public readonly client: ExtendedClient = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildPresences,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.DirectMessageTyping,
		],
		partials: [
			Partials.Message,
			Partials.Channel,
			Partials.User,
			Partials.Reaction,
		],
	}) as ExtendedClient;

	constructor(token: string, clientId: string, dev: boolean) {
		this.token = token;
		this.clientId = clientId;
		this.dev = dev;
	}

	/**
	 * Starts the bot by deploying commands and listeners, as well as supporting some startup events.
	 * @since 0.1.0
	 * @author Tyler
	 */
	public start() {
		this.deploy();
		catLogger.client("start() deployed commands successfully.");
		const cmdDir = path.join(__dirname, "commands");
		const eventsDir = path.join(__dirname, "events");
		const commandFiles = fs
			.readdirSync(cmdDir)
			.filter((file) => file.endsWith(".js"));

		this.client.commands = new Collection<string, any>();
		for (const file of commandFiles) {
			const filePath = path.join(cmdDir, file);
			const command = require(filePath);
			this.client.commands.set(command.data?.name, command);
		}

		const eventFiles = fs
			.readdirSync(eventsDir)
			.filter((file) => file.endsWith(".js"));

		for (const file of eventFiles) {
			const filePath = path.join(eventsDir, file);
			const event = require(filePath);
			if (event.once) {
				this.client.once(event.name, (...args) => event.execute(...args));
			} else {
				this.client.on(event.name, (...args) => event.execute(...args));
			}
			catLogger.client(`Deploying listener ${file} on event ${event.name}...`);
		}
		catLogger.client(`The following events have deployed listeners...`);
		for (const event of this.client.eventNames()) {
			catLogger.client(event);
		}

		this.client.login(this.token).then((user: string) => {
			catLogger.client("Logged in successfully!");
			if (this.dev) {
				this.client.user!.setActivity({
					type: ActivityType.Watching,
					name: "Tyler fix things",
				});
			} else {
				this.client.user!.setActivity({
					type: ActivityType.Playing,
					name: "with HR files",
				});
			}
		});
	}

	/**
	 * Deploys our interaction commands - this bot shouldn't *need* them, but we'll keep it regardless.
	 * @private
	 * @since 0.1.0
	 * @author Tyler
	 */
	private deploy() {
		const cmds = [];
		const cmdDir = path.join(__dirname, "commands");
		const cmdFiles = fs
			.readdirSync(cmdDir)
			.filter((file) => file.endsWith(".js"));
		for (const file of cmdFiles) {
			const filepath = path.join(cmdDir, file);
			const command = require(filepath);
			catLogger.client(
				`Deploying command /${command.data.name} ${command.permit !== undefined
					? `with permit level ${command.permit}`
					: "with an assumed permit level of 10."
				}`,
			);
			cmds.push(command.data.toJSON());
		}
		const rest = new REST({ version: "10" }).setToken(this.token);
		rest
			.put(Routes.applicationCommands(this.clientId), {
				body: cmds,
			})
			.then(() =>
				catLogger.client(`Successfully deployed ${cmds.length} commands.`),
			)
			.catch((err: Error) => {
				catLogger.error(`Command deployment issue - stack attached.`);
				catLogger.error(err.message);
				process.exit(1);
			});
	}

	/**
	 * Gets the websocket ping of the API Client.
	 * @returns ping - The websocket ping as an integer.
	 */
	public getClientPing() {
		return this.client.ws.ping;
	}
}