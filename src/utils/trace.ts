import catLogger from "./catloggr";
import fs from "fs"
import path from "path"

export interface Trace {
	id: string,
	[key: string]: any
}

class Tracer {
	private static instance: Tracer;
	private traceList: { [id: string]: Trace } = {}
	private constructor() {}

	public static getInstance() {
		if (!Tracer.instance) Tracer.instance = new Tracer()
		return Tracer.instance
	}

	public startTrace(id: string, data: Partial<Trace>) {
		this.traceList[id] = {
			id,
			...data
		}
		catLogger.client(`TRACE: New Trace with ID ${id} started.`)
	}

	public appendToTrace(id: string, data: Partial<Trace>) {
		const trace = this.traceList[id]
		if (!trace) catLogger.debug(`TRACE: Attempted to append data to Trace ID ${id} but failed.`)
		this.traceList[id] = {
			...this.traceList[id],
			...data
		}
		catLogger.client(`TRACE: Appended data to Trace with ID ${id}.`)
	}

	public closeTrace(id: string, status: boolean) {
		if (!this.traceList[id]) {
			catLogger.debug(`TRACE: Attempted to write Trace ID ${id} to disk, but failed.`)
		}
		this.traceList[id] = {
			...this.traceList[id],
			status
		}
		if (!status) catLogger.debug(`TRACE: New Trace with ID ${id} exited with an error state.`)
		try {
			fs.writeFile(path.join(__dirname, `traces/${id}.json`), JSON.stringify(this.traceList[id]), (err) => {
				if (err) {
					catLogger.debug(`TRACE: Attempted to write Trace ID ${id} to disk, but failed.`)
					catLogger.debug(err.message)
				}
				else catLogger.client(`TRACE: Trace ID ${id} closed and written to disk successfully.`)
			})
			delete this.traceList[id]
		}
		catch (e: any) {
			catLogger.debug(`TRACE: Attempted to write Trace ID ${id} to disk, but failed.`)
			catLogger.debug(e.message)
		}

	}
}

export const MainTracer = Tracer.getInstance()