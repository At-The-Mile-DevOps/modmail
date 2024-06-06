import { Client, Collection } from "discord.js"

/**
 * Typecast extension on the original Client to allow for extended collections.
 */
interface ExtendedClient extends Client {
	commands: Collection<string, any>;
}
