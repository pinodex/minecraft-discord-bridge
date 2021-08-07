const { WebhookClient } = require('discord.js');
const logger = require('../logger');

const DEFAULT_AVATARURL = 'https://cdn.discordapp.com/avatars/873436090982346823/2e293c07de6988d50b285ebf0ff10fab.png?size=128';

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

  async sendGenericMessage(message, avatar = DEFAULT_AVATARURL) {
    const payload = {
      username: 'minecraft',
      avatarURL: avatar,
      content: message,
    };

    logger.debug(`Sending Discord Webhook Message: ${JSON.stringify(payload)}`);

    await this.client.send(payload);
  }

  async sendEmbedMessage(username, avatar, embeds) {
    const payload = {
      username,
      avatarURL: avatar,
      embeds,
    };

    logger.debug(`Sending Discord Webhook Message: ${JSON.stringify(payload)}`);

    await this.client.send(payload);
  }

  async sendGenericEmbedMessage(embeds, avatar = DEFAULT_AVATARURL) {
    const payload = {
      username: 'minecraft',
      avatarURL: avatar,
      embeds,
    };

    logger.debug(`Sending Discord Webhook Message: ${JSON.stringify(payload)}`);

    await this.client.send(payload);
  }
}

module.exports = DiscordWebhookChatSender;
