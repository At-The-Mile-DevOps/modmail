import CatLoggr from "cat-loggr/ts";

const catLogger = new CatLoggr({
	levels: [
		{
			name: "events",
			// @ts-ignore
			color: CatLoggr._chalk.yellow.yellowBright,
		},
		{
			name: "client",
			// @ts-ignore
			color: CatLoggr._chalk.green.greenBright,
		},
		{
			name: "modmail",
			// @ts-ignore
			color: CatLoggr._chalk.magenta.magentaBright,
		},
		{
			name: "debug",
			// @ts-ignore
			color: CatLoggr._chalk.red.redBright
		}
	],
});

export default catLogger;