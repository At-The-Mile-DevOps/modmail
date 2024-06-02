import { configDotenv } from "dotenv"
import ModMailClient from "./Client"
import settings from "./settings.json"
configDotenv()

const client = new ModMailClient(process.env.TOKEN as string, settings.CLIENT_ID, true)
client.start()

