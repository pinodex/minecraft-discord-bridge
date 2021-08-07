const { Rcon } = require('rcon-client');
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
    this.client = new Rcon({ host, port, password });
  }

  /**
   * Connect to RCON
   */
  async connect() {
    await this.client.connect();
  }

  /**
   * Send message
   * @param  {String} username Username
   * @param  {String} message  Message
   */
  async sendMessage(username, message) {
    await this.client.send(`tellraw @a "<${username}> ${message}"`);

    logger.info(`Sending RCON message from ${username}: ${message}`);
  }
}

module.exports = RconWrapper;
