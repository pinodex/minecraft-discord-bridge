const { Rcon } = require('rcon-client');
const { timeout } = require('../utils');
const {getLoggerInstance} = require("../lib/logger");

class RconWrapper {
  logger;

  /**
   * Constructs RconWrapper
   *
   * @param  {string} id       Server ID
   * @param  {string} host     RCON Host
   * @param  {number} port     RCON Port
   * @param  {string} password RCON Password
   */
  constructor(id, host, port, password) {
    this.logger = getLoggerInstance(id);

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
      this.logger.info('Connecting to RCON');

      await this.client.connect();

      this.logger.info('Connected to RCON');
    } catch (e) {
      await this.retryConnection();
    }
  }

  async retryConnection() {
    if (this.connected) {
      return;
    }

    await timeout(10000);
    await this.connect();
  }

  /**
   * Send message
   * @param  {String} username Username
   * @param  {String} message  Message
   */
  async sendMessage(username, message) {
    if (!this.connected) {
      this.logger.info('RCON not connected. Cannot send message');

      return null;
    }

    await this.client.send(`tellraw @a "§9<${username}>§f ${message}"`);

    this.logger.info(`Sending RCON message from ${username}: ${message}`);

    return true;
  }

  /**
   * Send generic command and get response
   *
   * @param  {String} command Command
   * @return {Promise<String>}
   */
  async sendCommand(command) {
    if (!this.connected) {
      this.logger.info('RCON not connected. Cannot send message');

      return null;
    }

    return this.client.send(command);
  }
}

module.exports = RconWrapper;
