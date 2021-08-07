const EventEmitter = require('events');
const { Tail } = require('tail');
const logger = require('../logger');
const events = require('../events');

/**
 * List of match rules
 * @type {Array}
 */
const matchRules = [
  {
    type: events.MC_SERVER_MESSAGE,
    /* eslint no-useless-escape: off */
    pattern: /\[(.*)\] \[Server thread\/INFO\] \[net\.minecraft\.server\.dedicated\.DedicatedServer\/\]: \[Server\] (.*)/,
    handler(matches) {
      const [timestamp, message] = matches.slice(1);

      return { timestamp, message };
    },
  },
  {
    type: events.MC_SERVER_STARTING,
    /* eslint no-useless-escape: off */
    pattern: /\[(.*)\] \[main\/INFO\] \[cpw\.mods\.modlauncher\.LaunchServiceHandler\/MODLAUNCHER\]: Launching target 'fmlserver'/,
    handler(matches) {
      const [timestamp] = matches.slice(1);

      return { timestamp };
    },
  },
  {
    type: events.MC_SERVER_STARTING,
    /* eslint no-useless-escape: off */
    pattern: /\[(.*)\] \[main\/INFO\] \[cp\.mo\.mo\.LaunchServiceHandler\/MODLAUNCHER\]: Launching target 'fmlserver'/,
    handler(matches) {
      const [timestamp] = matches.slice(1);

      return { timestamp };
    },
  },
  {
    type: events.MC_SERVER_OPEN,
    /* eslint no-useless-escape: off */
    pattern: /\[(.*)\] \[Server thread\/INFO\] \[net\.minecraft\.server\.dedicated\.DedicatedServer\/\]: Done/,
    handler(matches) {
      const [timestamp] = matches.slice(1);

      return { timestamp };
    },
  },
  {
    type: events.MC_SERVER_CLOSED,
    /* eslint no-useless-escape: off */
    pattern: /\[(.*)\] \[Server thread\/INFO\] \[net\.minecraft\.server\.MinecraftServer\/\]: Stopping server/,
    handler(matches) {
      const [timestamp] = matches.slice(1);

      return { timestamp };
    },
  },
  {
    type: events.MC_SERVER_CRASHED,
    /* eslint no-useless-escape: off */
    pattern: /\[(.*)\] \[Server thread\/FATAL\] \[net\.minecraftforge\.common\.ForgeMod\/\]: Preparing crash report with UUID (.*)/,
    handler(matches) {
      const [timestamp, uid] = matches.slice(1);

      return { timestamp, uid };
    },
  },
  {
    type: events.MC_PLAYER_CHAT,
    /* eslint no-useless-escape: off */
    pattern: /\[(.*)\] \[Server thread\/INFO\] \[net\.minecraft\.server\.dedicated\.DedicatedServer\/\]: \<(\w+)\> (.*)/,
    handler(matches) {
      const [timestamp, username, message] = matches.slice(1);

      return { timestamp, username, message };
    },
  },
  {
    type: events.MC_PLAYER_ADVANCEMENT,
    /* eslint no-useless-escape: off */
    pattern: /\[(.*)\] \[Server thread\/INFO\] \[net\.minecraft\.server\.dedicated\.DedicatedServer\/]: (\w+) has made the advancement \[(.*)]/,
    handler(matches) {
      const [timestamp, username, advancement] = matches.slice(1);

      return { timestamp, username, advancement };
    },
  },
  {
    type: events.MC_PLAYER_JOINED,
    /* eslint no-useless-escape: off */
    pattern: /\[(.*)\] \[Server thread\/INFO\] \[net\.minecraft\.server\.dedicated\.DedicatedServer\/\]: (\w+) joined the game/,
    handler(matches) {
      const [timestamp, username] = matches.slice(1);

      return { timestamp, username };
    },
  },
  {
    type: events.MC_PLAYER_LEFT,
    /* eslint no-useless-escape: off */
    pattern: /\[(.*)\] \[Server thread\/INFO\] \[net\.minecraft\.server\.dedicated\.DedicatedServer\/\]: (\w+) left the game/,
    handler(matches) {
      const [timestamp, username] = matches.slice(1);

      return { timestamp, username };
    },
  },
];

/**
 * MinecraftLogListener
 */
class MinecraftLogListener extends EventEmitter {
  /**
   * Constructs MinecraftLogListener
   * @param  {String} logFile Path to Minecraft Log File
   */
  constructor(logFile) {
    super();

    this.tail = new Tail(logFile, {
      useWatchFile: true,
      fsWatchOptions: {
        interval: 500,
      },
    });

    this.tail.on('line', this.handleLine.bind(this));
    this.tail.on('error', logger.error);

    logger.info(`Listening to log file ${logFile}`);
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

    logger.debug(`Log line: ${line}`);

    let matches = null;

    const rule = matchRules.find(({ pattern }) => {
      matches = line.match(pattern);

      return matches;
    });

    if (!rule || !matches) {
      return;
    }

    const data = rule.handler(matches);

    if (data) {
      logger.debug(`Minecraft Event [${rule.type}]: ${JSON.stringify(data)}`);

      this.emit(rule.type, data);
    }
  }
}

module.exports = { MinecraftLogListener, events };
