const EventEmitter = require('events');
const { Tail } = require('tail');
const logger = require('../logger');
const RULES = require('../rules');

/**
 * MinecraftLogListener
 */
class MinecraftLogListener extends EventEmitter {
  key;
  name;

  /**
   * @typedef MinecraftLogListenerOptions
   * @property {string=} name Minecraft Server Name
   * @property {string} key Minecraft Server Unique Key Identifier
   */

  /**
   * Constructs MinecraftLogListener
   * @param  {string} logFile Path to Minecraft Log File
   * @param {MinecraftLogListenerOptions} options Minecraft Server Key
   */
  constructor(logFile, options) {
    super();

    const { name = 'Minecraft Server', key } = options;

    this.key = key;
    this.name = name;

    this.tail = new Tail(logFile, {
      useWatchFile: true,
      fsWatchOptions: {
        interval: 500,
      },
    });

    this.tail.on('line', this.handleLine.bind(this));
    this.tail.on('error', (err) => {
      logger.error(`[ERROR] [${this.key}] ${err}`);
    });

    logger.info(`[${this.key}] Listening to log file ${logFile}`);
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

    logger.debug(`[${this.key}] Log line: ${line}`);

    let matches = null;

    const matchRules = RULES?.[this.key];

    if (!matchRules) {
      logger.error(`[ERROR] [${this.key}] Can't find match rules`);
      return;
    }

    const rule = matchRules.find(({ pattern }) => {
      matches = line.match(pattern);

      return matches;
    });

    if (!rule || !matches) {
      return;
    }

    const data = rule.handler(matches);

    if (data) {
      logger.debug(`[${this.key}] Minecraft Event [${rule.type}]: ${JSON.stringify(data)}`);

      this.emit(rule.type, data);
    }
  }
}

module.exports = { MinecraftLogListener };
