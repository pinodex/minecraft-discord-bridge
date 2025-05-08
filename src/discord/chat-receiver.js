const EventEmitter = require('events');
const { Client, Intents } = require('discord.js');
const { EVENTS} = require('../constants');
const { getLoggerInstance } = require("../lib/logger");

const commands = [
  {
    name: 'playerlist',
    description: 'Returns the current player list in Minecraft Server.',
  }
];

class DiscordChatReceiver extends EventEmitter {
  logger;

  /**
   * Constructs DiscordWebhookChatReceiver
   * @param  {string} serverId  Minecraft Server ID
   * @param  {String} token     Discord App Token
   * @param  {String} channelId Discord Channel ID
   */
  constructor(serverId, token, channelId) {
    super();

    this.logger = getLoggerInstance(serverId);

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
    this.client.on('interactionCreate', this.onClientInteractionCreate.bind(this));

    this.commandHandlers = {};
  }

  /**
   * Add command handler for Discord interactions
   * @param {String} commandName Command name
   * @param {Function} handler     Handler function
   */
  addCommandHandler(commandName, handler) {
    this.commandHandlers[commandName] = handler;
  }

  /**
   * Login to Discord
   */
  async login() {
    this.logger.debug('Logging in to Discord API');

    try {
      await this.client.login(this.token);

      this.logger.info('Logged in to Discord API');
    } catch (e) {
      this.logger.error(`Cannot login to Discord API: ${e}`);
    }
  }

  /**
   * Discord.js Client Ready Event Handler
   */
  async onClientReady(client) {
    this.logger.info(`Discord Client Ready. App ID: ${client.application.id}`);

    this.emit(EVENTS.DISCORD_CLIENT_READY, client);

    const channel = await this.fetchChannel();

    if (channel.type !== 'GUILD_TEXT') {
      this.logger.error('Invalid Discord chat receiver channel type');

      return;
    }

    await this.registerCommands(channel.guildId);
  }

  /**
   * Discord.js Client Message Event Handler
   *
   * @param  {String} message Message
   */
  async onClientMessageCreate(message) {
    if (message.channelId !== this.channelId || !message.author) {
      return;
    }

    if (message.author.bot || message.author.system) {
      return;
    }

    this.emit(EVENTS.DISCORD_USER_CHAT, {
      username: message.author.username,
      message: message.content,
    });
  }

  /**
   * Discord.js Client Interaction
   * @param  {Discord.CommandInteraction} interaction Discord Interaction
   */
  async onClientInteractionCreate(interaction) {
    if (!interaction.isCommand()) {
      return;
    }

    const handler = this.commandHandlers[interaction.commandName];

    if (!handler) {
      return;
    }

    const response = await handler(interaction);

    await interaction.reply(response);
  }

  /**
   * Register Bot Commands
   *
   * @param  {String} guildId Guild ID
   * @return {Discord.ApplicationCommandManager}
   */
  async registerCommands(guildId) {
    this.logger.debug('Registering commands');

    const guild = await this.client.guilds.fetch(guildId);

    // This will remove all the existing commands
    const createdCommands = await guild.commands.set(commands);

    const listOfCommands = createdCommands.map((command) => `/${command.name}`);

    this.logger.info(`Registered ${listOfCommands.length} commands: ${listOfCommands}`);
  }

  /**
   * Fetch the specified Discord Channel ID
   *
   * @return {Discord.GuildChannel}
   */
  async fetchChannel() {
    this.logger.debug(`Fetching Discord Channel ID ${this.channelId}`);

    try {
      const channel = await this.client.channels.fetch(this.channelId);

      this.logger.info(`Fetched Discord Channel. Channel ID: ${channel.id}`);

      return channel;
    } catch (e) {
      this.logger.error(`Cannot fetch Discord Channel: ${e}`);
    }

    return null;
  }
}

module.exports = DiscordChatReceiver;
