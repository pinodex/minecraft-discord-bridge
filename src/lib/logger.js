const { createLogger, transports, format, addColors } = require('winston');
const {SERVER_IDS_ARR} = require("../constants");

const colorizer = format.colorize();

addColors({
  info: 'blue',
  error: 'red',
  warn: 'yellow',
  debug: 'green',
  server: "magenta",
  timestamp: "gray"
});

const instances = new Map();
let isInitialized = false;

const init = () => {
  if (isInitialized) {
    console.log("Logger is already initialized!");
    return;
  }

  console.log("Initialize Logger Instances")
  SERVER_IDS_ARR.forEach(id => {
    const instance = instances.get(id);

    if (!instance) {
      const logger = createLogger({
        level: "debug",
        format: format.combine(
          format.label({ label: id }), // <-- Add your prefix here
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Optional
          format.printf(({ level, message, label, timestamp }) => {
            const coloredLevel = colorizer.colorize(level, `[${level.toUpperCase()}]`);
            const coloredTimestamp = colorizer.colorize("timestamp", `[${timestamp}]`);
            const coloredServer = colorizer.colorize("server", `[SERVER:${label}]`);

            return `${coloredTimestamp} ${coloredServer} ${coloredLevel}: ${message}`;
          })
        ),
        transports: [new transports.Console()],
      })

      instances.set(id, logger);
    }
  })
  isInitialized = true
  console.log("Successfully Initialize Logger Instances")
}

/**
 * @typedef LoggerInstance
 * @property {(message: string) => void} info
 * @property {(message: string) => void} debug
 * @property {(message: string) => void} warn
 * @property {(message: string) => void} error
 */

/**
 * Get Logger Instance
 * @param {string} id
 * @return {LoggerInstance}
 */
const getLoggerInstance = (id) => {
  if (!isInitialized) {
    throw new Error(`Logger key '${id}' is not initialized!`);
  }

  const instance = instances.get(id);

  if (!instance) {
    throw new Error(`Can't find logger instance '${id}'`);
  }

  return {
    info: (...messages) => instance.info(messages),
    warn: (...messages) => instance.warn(messages),
    error: (...messages) =>  instance.error(messages),
    debug: (...messages) => instance.debug(messages),
  }
}

module.exports = {
  init,
  getLoggerInstance,
}
