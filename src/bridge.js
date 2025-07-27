const { EVENTS } = require('./constants');

const { MinecraftLogListener } = require('./minecraft/log');
const { getPlayerAvatarUrl } = require('./minecraft/player');
const RconWrapper = require('./minecraft/rcon-wrapper');

const DiscordWebhookChatSender = require('./discord/chat-webhook-sender');
const DiscordChatReceiver = require('./discord/chat-receiver');
const MinecraftStatusMonitor = require("./minecraft/server");

/**
 * @typedef BridgeConfigRCON
 * @property {string} host
 * @property {number} port
 * @property {string} password
 */

/**
 * @typedef BridgeConfigDiscordWebhookUrl
 * @property {string} chat
 * @property {string} notifications
 * @property {string} status
 */

/**
 * @typedef BridgeConfigDiscordChannelId
 * @property {string} chat
 */

/**
 * @typedef BridgeConfigDiscordCategoryId
 * @property {string} main
 */

/**
 * @typedef BridgeConfigDiscord
 * @property {string} token
 * @property {BridgeConfigDiscordChannelId} channels
 * @property {BridgeConfigDiscordCategoryId} category
 * @property {BridgeConfigDiscordWebhookUrl} webhooks
 */

/**
 * @typedef BridgeConfig
 * @property {string} id
 * @property {string} name
 * @property {string} logFile
 * @property {string} host
 * @property {string} port
 * @property {BridgeConfigRCON} rcon
 * @property {BridgeConfigDiscord} discord
 * @property {Rule[]} rules
 */

/**
 * Minecraft Bridge
 * @param {BridgeConfig} config
 */
const bridge = (config) => {
  const minecraft = new MinecraftLogListener(config.logFile, {
    id: config.id,
    name: config.name,
    rules: config.rules,
  });

  const rcon = new RconWrapper(config.id, config.rcon.host, config.rcon.port, config.rcon.password);

  const discordNotificationSender = new DiscordWebhookChatSender(
    config.id,
    config.discord.webhooks.notifications,
  );

  const discordChatSender = new DiscordWebhookChatSender(
    config.id,
    config.discord.webhooks.chat
    );

  const discordStatusSender = new DiscordWebhookChatSender(
    config.id,
    config.discord.webhooks.status
  );

  const discordChatReceiver = new DiscordChatReceiver(
    config.id,
    config.discord.token,
    config.discord.channels.chat,
  );

  minecraft.on(EVENTS.MC_SERVER_STARTING, () => {
    discordStatusSender.sendGenericEmbedMessage([
      {
        title: 'Starting Server',
        description: 'The server is now starting. Please wait for a few seconds',
        color: 15105570,
      },
    ]);
  });

  minecraft.on(EVENTS.MC_SERVER_OPEN, () => {
    discordStatusSender.sendGenericEmbedMessage([
      {
        title: 'Server is Up',
        description: 'You can now connect to Minecraft Server',
        color: 5763719,
        footer: {
          text: `IP: ${config.host}`,
        },
      },
    ]);
  });

  minecraft.on(EVENTS.MC_SERVER_CLOSED, () => {
    discordStatusSender.sendGenericEmbedMessage([
      {
        title: 'Server is Down',
        description: 'Server is temporarily down. see you later',
        color: 15548997,
      },
    ]);
  });

  minecraft.on(EVENTS.MC_SERVER_CRASHED, ({ uid }) => {
    discordStatusSender.sendGenericEmbedMessage([
      {
        title: 'Server Crashed',
        description: 'The server will start soon',
        color: 15548997,
        footer: {
          text: `UID: ${uid}`,
        },
      },
    ]);
  });

  minecraft.on(EVENTS.MC_PLAYER_CHAT, async ({ username, message }) => {
    const avatar = getPlayerAvatarUrl(username);

    await discordChatSender.sendPlayerMessage(username, avatar, message);
  });

  minecraft.on(EVENTS.MC_PLAYER_JOINED, async ({ username }) => {
    const avatar = getPlayerAvatarUrl(username, 24);

    await discordNotificationSender.sendGenericEmbedMessage([
      {
        description: `**${username}** joined the game`,
        color: 5763719,
        thumbnail: {
          url: avatar,
        },
      },
    ]);
  });

  minecraft.on(EVENTS.MC_PLAYER_ADVANCEMENT, async ({ username, advancement, type }) => {
    const types = {
      goal: {
        text: 'has reached the goal',
        color: 5763719,
      },
      advancement: {
        text: 'has made an advancement',
        color: 5763719,
      },
      challenge: {
        text: 'has completed the challenge',
        color: 7419530,
      },
    };

    const { text, color } = types[type];

    await discordNotificationSender.sendGenericEmbedMessage([
      {
        title: advancement,
        description: `**${username}** ${text}.`,
        color,
      },
    ]);
  });

  minecraft.on(EVENTS.MC_PLAYER_LEFT, async ({ username }) => {
    const avatar = getPlayerAvatarUrl(username, 24);

    await discordNotificationSender.sendGenericEmbedMessage([
      {
        description: `**${username}** left the game`,
        color: 15548997,
        thumbnail: {
          url: avatar,
        },
      },
    ]);
  });

  discordChatReceiver.on(EVENTS.DISCORD_USER_CHAT, async ({ username, message }) => {
    await rcon.sendMessage(username, message);
  });

  discordChatReceiver.addCommandHandler('playerlist', (interaction) => {
    if (interaction.channelId === config.discord.channels.chat) {
      return rcon.sendCommand('list');
    }
  });

  rcon.connect();

  discordChatReceiver.login();

  if (config.discord.category?.main) {
    const serverStatusMonitor = new MinecraftStatusMonitor({
      categoryId: config.discord.category.main,
      token: config.discord.token,
      intervalMs: 60 * 1000,
      serverId: config.id,
      port: config.port
    })

    serverStatusMonitor.start();
  }
};

module.exports = bridge
