const EventEmitter = require('events');
const { Tail } = require('tail');
const { getLoggerInstance } = require("../lib/logger");

/**
 * MinecraftLogListener
 */
class MinecraftLogListener extends EventEmitter {
  id;
  name;
  logger;
  rules;

  /**
   * @typedef MinecraftLogListenerOptions
   * @property {string=} name Minecraft Server Name
   * @property {string} id Minecraft Server Unique Identifier
   * @property {any[]} rules
   */

  /**
   * Constructs MinecraftLogListener
   * @param  {string} logFile Path to Minecraft Log File
   * @param {MinecraftLogListenerOptions} options Minecraft Server Key
   */
  constructor(logFile, options) {
    super();

    const { name = 'Minecraft Server', id } = options;

    this.id = id;
    this.name = name;
    this.rules = options.rules;
    this.logger = getLoggerInstance(id);

    this.tail = new Tail(logFile, {
      useWatchFile: true,
      fsWatchOptions: {
        interval: 500,
      },
    });

    this.tail.on('line', this.handleLine.bind(this));
    this.tail.on('error', (err) => {
      this.logger.error(err);
    });

    this.logger.info(`Listening to log file ${logFile}`);
  }

  /**
   * Handles log line
   *
   * @param  {String} line Log line
   */
  handleLine(line) {
    if (typeof line !== 'string') {
      return;
    }

    this.logger.debug(`Log line: ${line}`);

    let matches = null;

    const rule = this.rules.find(({ pattern }) => {
      matches = line.match(pattern);

      return matches;
    });

    if (!rule || !matches) {
      return;
    }

    const data = rule.handler(matches);

    if (data) {
      this.logger.debug(`Minecraft Event [${rule.type}]: ${JSON.stringify(data)}`);

      this.emit(rule.type, data);
    }
  }
}

module.exports = { MinecraftLogListener };
