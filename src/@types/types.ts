import { Client, Collection } from "discord.js"

/**
 * Typecast extension on the original Client to allow for extended collections.
 */
export interface ExtendedClient extends Client {
	commands: Collection<string, any>;
}

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