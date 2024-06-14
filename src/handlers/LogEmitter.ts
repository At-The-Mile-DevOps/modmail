import { EventEmitter } from "node:events"
import eventLogger from "./eventLogger"

// Custom EventEmitter extension for tracking desired logs.

class CustomEmitter extends EventEmitter {}

const LogEmitter = new CustomEmitter()

LogEmitter.on('init', () => {
	eventLogger('init')
})

LogEmitter.on('contact', (discordId: string, status: boolean) => {
	eventLogger('contact', discordId, `${status}`)
})

LogEmitter.on('close', (success: boolean, ticketDiscordId?: string, closeStaffId?: string) => {
	eventLogger('close', `${success}`, ticketDiscordId, closeStaffId)
})

LogEmitter.on('userMessage', (user: string) => {
	eventLogger('userMessage', user)
})

export default LogEmitter