const EventEmitter = require('events');
const { Client, Intents } = require('discord.js');
const logger = require('../logger');
const events = require('../events');

class DiscordChatReceiver extends EventEmitter {
  /**
   * Constructs DiscordWebhookChatReceiver
   * @param  {String} token     Discord App Token
   * @param  {String} channelId Discord Channel ID
   */
  constructor(token, channelId) {
    super();

    this.client = new Client({
      intents: [
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
      ],
    });

    this.token = token;
    this.channelId = channelId;

    this.client.on('ready', this.onClientReady.bind(this));
    this.client.on('messageCreate', this.onClientMessageCreate.bind(this));
  }

  /**
   * Login to Discord
   */
  async login() {
    logger.debug('Logging in to Discord API');

    try {
      await this.client.login(this.token);

      logger.info('Logged in to Discord API');
    } catch (e) {
      logger.error(`Cannot login to Discord API: ${e}`);
    }
  }

  /**
   * Discord.js Client Ready Event Handler
   */
  async onClientReady(client) {
    logger.info(`Discord Client Ready. App ID: ${client.application.id}`);

    this.emit(events.DISCORD_CLIENT_READY, client);

    await this.fetchChannel();
  }

  /**
   * Discord.js Client Message Event Handler
   */

  async onClientMessageCreate(message) {
    if (message.channelId !== this.channelId || !message.author) {
      return;
    }

    if (message.author.bot || message.author.system) {
      return;
    }

    this.emit(events.DISCORD_USER_CHAT, {
      username: message.author.username,
      message: message.content,
    });
  }

  /**
   * Fetch the specified Discord Channel ID
   *
   * @return {Discord.GuildChannel}
   */
  async fetchChannel() {
    logger.debug(`Fetching Discord Channel ID ${this.channelId}`);

    try {
      const channel = await this.client.channels.fetch(this.channelId);

      logger.info(`Fetched Discord Channel. Channel ID: ${channel.id}`);

      return channel;
    } catch (e) {
      logger.error(`Cannot fetch Discord Channel: ${e}`);
    }

    return null;
  }
}

module.exports = DiscordChatReceiver;
