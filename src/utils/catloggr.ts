import CatLoggr from "cat-loggr/ts";

const catLogger = new CatLoggr({
  levels: [
    {
      name: "events",
      // @ts-expect-error 2322
      color: CatLoggr._chalk.yellow.yellowBright,
    },
    {
      name: "client",
      // @ts-expect-error 2322
      color: CatLoggr._chalk.green.greenBright,
    },
    {
      name: "modmail",
      // @ts-expect-error 2322
      color: CatLoggr._chalk.magenta.magentaBright,
    },
    {
      name: "debug",
      // @ts-expect-error 2322
      color: CatLoggr._chalk.red.redBright,
    },
  ],
});

export default catLogger;