import { configDotenv } from "dotenv"
import ModMailClient from "./Client"
import settings from "./settings.json"
import { PrismaClient } from "@prisma/client"
import catLogger from "./utils/catloggr"
import { Events } from "discord.js"
configDotenv()

const client = new ModMailClient(process.env.TOKEN as string, settings.CLIENT_ID, true)
client.start()
const prisma = new PrismaClient()

client.client.on(Events.Error, (e) => {
	catLogger.events("Anti-Crash - Trace follows...")
	console.error(e.stack)
	return
})

export default client
export { prisma }