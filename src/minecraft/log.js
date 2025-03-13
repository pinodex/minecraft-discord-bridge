// eslint-disable-next-line max-classes-per-file
const EventEmitter = require('events');
const Client = require('ssh2-sftp-client');
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
    pattern:
      /\[(.*)\] \[Server thread\/INFO\] \[minecraft\/MinecraftServer\]: \[Not Secure\] \[Server\] (.*)/,
    handler(matches) {
      const [timestamp, message] = matches.slice(1);

      return { timestamp, message };
    },
  },
  {
    type: events.MC_SERVER_STARTING,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[main\/INFO\]: Loading Minecraft (.*) with Fabric Loader (.*)/,
    handler(matches) {
      const [timestamp] = matches.slice(1);

      return { timestamp };
    },
  },
  {
    type: events.MC_SERVER_OPEN,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: Done/,
    handler(matches) {
      const [timestamp] = matches.slice(1);

      return { timestamp };
    },
  },
  {
    type: events.MC_SERVER_CLOSED,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: Stopping server/,
    handler(matches) {
      const [timestamp] = matches.slice(1);

      return { timestamp };
    },
  },
  {
    type: events.MC_SERVER_CRASHED,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/FATAL\]: Preparing crash report with UUID (.*)/,
    handler(matches) {
      const [timestamp, uid] = matches.slice(1);

      return { timestamp, uid };
    },
  },
  {
    type: events.MC_PLAYER_CHAT,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: \[Not Secure\] \<(\w+)\> (.*)/,
    handler(matches) {
      const [timestamp, username, message] = matches.slice(1);

      return { timestamp, username, message };
    },
  },
  {
    type: events.MC_PLAYER_ADVANCEMENT,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: (\w+) has made the advancement \[(.*)]/,
    handler(matches) {
      const [timestamp, username, advancement] = matches.slice(1);

      return {
        timestamp,
        username,
        advancement,
        type: 'advancement',
      };
    },
  },
  {
    type: events.MC_PLAYER_ADVANCEMENT,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: (\w+) has reached the goal \[(.*)]/,
    handler(matches) {
      const [timestamp, username, advancement] = matches.slice(1);

      return {
        timestamp,
        username,
        advancement,
        type: 'goal',
      };
    },
  },
  {
    type: events.MC_PLAYER_ADVANCEMENT,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: (\w+) has completed the challenge \[(.*)]/,
    handler(matches) {
      const [timestamp, username, advancement] = matches.slice(1);

      return {
        timestamp,
        username,
        advancement,
        type: 'challenge',
      };
    },
  },
  {
    type: events.MC_PLAYER_JOINED,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: (\w+) joined the game/,
    handler(matches) {
      const [timestamp, username] = matches.slice(1);

      return { timestamp, username };
    },
  },
  {
    type: events.MC_PLAYER_LEFT,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: (\w+) left the game/,
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

class MinecraftLogListenerSFTP extends EventEmitter {
  /**
   * Constructs MinecraftLogListener
   // eslint-disable-next-line max-len
   * @param  {Object} sftpConfig Configuration for SFTP connection (host, port, username, password or privateKey, etc.)
   * @param  {String} remoteLogFile Full path to the remote Minecraft log file
   */
  constructor(sftpConfig, remoteLogFile) {
    super();

    this.sftpConfig = sftpConfig;
    this.remoteLogFile = remoteLogFile;
    this.pollInterval = 500; // Poll every 500ms (adjust as needed)
    this.offset = 0; // Current read position in the file
    this.buffer = ''; // Buffer to hold any incomplete log line

    this.sftp = new Client();
    this.connectSftp();
  }

  async connectSftp() {
    try {
      await this.sftp.connect(this.sftpConfig);
      logger.info(`Connected to SFTP server: ${this.sftpConfig.host}`);

      // Start from the current end of the file (ignore any pre-existing content)
      const stat = await this.sftp.stat(this.remoteLogFile);
      this.offset = stat.size;
      logger.info(`Starting at offset ${this.offset} for ${this.remoteLogFile}`);

      // Begin polling for new log data
      this.poller = setInterval(() => {
        this.pollLog().catch((err) => {
          logger.error('Error polling remote log:', err);
        });
      }, this.pollInterval);
    } catch (err) {
      logger.error('SFTP connection error:', err);
      this.emit('error', err);
    }
  }

  async pollLog() {
    try {
      // Get the latest file stats
      const stat = await this.sftp.stat(this.remoteLogFile);
      if (stat.size > this.offset) {
        // Calculate the new data length and update the offset
        const start = this.offset;
        const end = stat.size - 1; // end is inclusive
        this.offset = stat.size;

        // Create a read stream for the new chunk of data
        const stream = await this.sftp.createReadStream(this.remoteLogFile, { start, end });
        let data = '';

        stream.setEncoding('utf8');
        stream.on('data', (chunk) => {
          data += chunk;
        });
        stream.on('error', (err) => {
          logger.error('Error reading remote log file:', err);
        });
        stream.on('end', () => {
          this.processData(data);
        });
      }
    } catch (err) {
      logger.error('Error during pollLog:', err);
    }
  }

  /**
   * Process new data from the remote log file.
   * Splits data into lines, handling any incomplete line from the previous poll.
   *
   * @param {String} data New data read from the remote log file
   */
  processData(data) {
    if (!data) return;

    // Prepend any leftover incomplete line from last time.
    data = this.buffer + data;
    const lines = data.split(/\r?\n/);
    // The last element might be an incomplete line.
    this.buffer = lines.pop();

    lines.forEach((line) => this.handleLine(line));
  }

  /**
   * Handles a single log line.
   *
   * @param {String} line Log line
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

  /**
   * Closes the SFTP connection and stops polling.
   */
  async close() {
    clearInterval(this.poller);
    await this.sftp.end();
    logger.info('SFTP connection closed.');
  }
}

module.exports = { MinecraftLogListener, MinecraftLogListenerSFTP, events };
