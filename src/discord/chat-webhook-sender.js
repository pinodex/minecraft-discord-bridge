const { WebhookClient } = require('discord.js');
const logger = require('../logger');

/**
 * DiscordWebhookChatSender
 *
 * Allows sending of messages to a Discord Channel via Webhook
 */
class DiscordWebhookChatSender {
  /**
   * Constructs DiscordWebhookChatSender
   * @param  {String} url Discord Webhook URL
   */
  constructor(url) {
    this.client = new WebhookClient({ url });
  }

  async sendPlayerMessage(username, avatar, message) {
    const payload = {
      username,
      avatarURL: avatar,
      content: message,
    };

    logger.debug(`Sending Discord Webhook Message: ${JSON.stringify(payload)}`);

    await this.client.send(payload);
  }

  async sendGenericMessage(message) {
    const payload = {
      username: 'Minecraft Server',
      content: message,
    };

    logger.debug(`Sending Discord Webhook Message: ${JSON.stringify(payload)}`);

    await this.client.send(payload);
  }

  async sendEmbedMessage(embeds) {
    const payload = {
      username: 'Minecraft Server',
      embeds
    };

    logger.debug(`Sending Discord Webhook Message: ${JSON.stringify(payload)}`);

    await this.client.send(payload);
  }
}

module.exports = DiscordWebhookChatSender;
