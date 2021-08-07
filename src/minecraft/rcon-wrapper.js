const { Rcon } = require('rcon-client');
const logger = require('../logger');

/**
 * Resolve promise after the specified duration
 * @param  {Number} duration Timeout duration in milliseconds
 * @return {Promise}
 */
const timeout = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

class RconWrapper {
  /**
   * Constructs RconWrapper
   *
   * @param  {String} host     RCON Host
   * @param  {Number} port     RCON Port
   * @param  {String} password RCON Password
   */
  constructor(host, port, password) {
    this.connected = false;

    this.client = new Rcon({ host, port, password });

    this.client.on('connect', () => {
      this.connected = true;
    });

    this.client.on('end', () => {
      this.connected = false;
      this.retryConnection();
    });

    this.client.on('error', () => {
      this.connected = false;
      this.retryConnection();
    });
  }

  /**
   * Connect to RCON
   */
  async connect() {
    try {
      await this.client.connect();

      logger.info('Connected to RCON.');
    } catch (e) {
      logger.error('Cannot connect to RCON');

      await this.retryConnection();
    }
  }

  async retryConnection() {
    if (this.connected) {
      return;
    }

    await timeout(1000);

    logger.info('Reconnecting to RCON');

    await this.connect();
  }

  /**
   * Send message
   * @param  {String} username Username
   * @param  {String} message  Message
   */
  async sendMessage(username, message) {
    await this.client.send(`tellraw @a "<§9${username}§f> ${message}"`);

    logger.info(`Sending RCON message from ${username}: ${message}`);
  }

  /**
   * Send generic command and get response
   *
   * @param  {String} command Command
   * @return {String}
   */
  async sendCommand(command) {
    return this.client.send(command);
  }
}

module.exports = RconWrapper;
