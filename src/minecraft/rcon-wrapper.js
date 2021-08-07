const { Rcon } = require('rcon-client');
const { timeout } = require('../utils');
const logger = require('../logger');

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
      logger.info('Connecting to RCON');

      await this.client.connect();

      logger.info('Connected to RCON');
    } catch (e) {
      await this.retryConnection();
    }
  }

  async retryConnection() {
    if (this.connected) {
      return;
    }

    await timeout(1000);
    await this.connect();
  }

  /**
   * Send message
   * @param  {String} username Username
   * @param  {String} message  Message
   */
  async sendMessage(username, message) {
    if (!this.connected) {
      logger.info('RCON not connected. Cannot send message');

      return null;
    }

    await this.client.send(`tellraw @a "§9<${username}>§f ${message}"`);

    logger.info(`Sending RCON message from ${username}: ${message}`);

    return true;
  }

  /**
   * Send generic command and get response
   *
   * @param  {String} command Command
   * @return {String}
   */
  async sendCommand(command) {
    if (!this.connected) {
      logger.info('RCON not connected. Cannot send message');

      return null;
    }

    return this.client.send(command);
  }
}

module.exports = RconWrapper;
