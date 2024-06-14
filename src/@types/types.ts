import { Client, Collection } from "discord.js"

/**
 * Typecast extension on the original Client to allow for extended collections.
 * @author Tyler
 * @since 0.1.0
 */
export interface ExtendedClient extends Client {
	commands: Collection<string, any>;
}

/**
 * Used for quantifying staff permit levels.
 * @author Tyler
 * @since 0.1.0
 */
enum Permit {
	"COMMUNITY",
	"STAFF",
	"EARLY_ACCESS_STAFF",
	"HR",
	"HRM",
	"LEADERSHIP",
	"DEVOPS" = 10
}

export { Permit }