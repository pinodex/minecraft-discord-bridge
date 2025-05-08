const { EVENTS } = require('./constants');

const { MinecraftLogListener } = require('./minecraft/log');
const { getPlayerAvatarUrl } = require('./minecraft/player');
const RconWrapper = require('./minecraft/rcon-wrapper');

const DiscordWebhookChatSender = require('./discord/chat-webhook-sender');
const DiscordChatReceiver = require('./discord/chat-receiver');
const { getLoggerInstance } = require("./lib/logger");

/**
 * @typedef BridgeConfigRCON
 * @property {string} host
 * @property {string} port
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
 * @typedef BridgeConfigDiscord
 * @property {string} token
 * @property {BridgeConfigDiscordChannelId} channels
 * @property {BridgeConfigDiscordWebhookUrl} webhooks
 */

/**
 * @typedef BridgeConfig
 * @property {string} id
 * @property {string} name
 * @property {string} logFile
 * @property {string} host
 * @property {BridgeConfigRCON} rcon
 * @property {BridgeConfigDiscord} discord
 */

/**
 * Minecraft Bridge
 * @param {BridgeConfig} config
 */
const bridge = (config) => {
  const minecraft = new MinecraftLogListener(config.logFile, {
    id: config.id,
    name: config.name
  });

  const rcon = new RconWrapper(config.id, config.rcon.host, config.rcon.port, config.rcon.password);
  //
  // const discordNotificationSender = new DiscordWebhookChatSender(
  //   DISCORD_MINECRAFT_NOTIFICATIONS_WEBHOOK_URL,
  // );
  //
  // const discordChatSender = new DiscordWebhookChatSender(DISCORD_MINECRAFT_CHAT_WEBHOOK_URL);
  // const discordStatusSender = new DiscordWebhookChatSender(DISCORD_MINECRAFT_STATUS_WEBHOOK_URL);
  //
  // const discordChatReceiver = new DiscordChatReceiver(
  //   DISCORD_MINECRAFT_BRIDGE_TOKEN,
  //   DISCORD_MINECRAFT_CHAT_CHANNEL_ID,
  // );
  //
  // minecraft.on(EVENTS.MC_SERVER_STARTING, () => {
  //   discordStatusSender.sendGenericEmbedMessage([
  //     {
  //       title: 'Starting Server',
  //       description: 'The server is now starting. Please wait for a few seconds',
  //       color: 15105570,
  //     },
  //   ]);
  // });
  //
  // minecraft.on(EVENTS.MC_SERVER_OPEN, () => {
  //   discordStatusSender.sendGenericEmbedMessage([
  //     {
  //       title: 'Server is Up',
  //       description: 'You can now connect to Minecraft Server',
  //       color: 5763719,
  //       footer: {
  //         text: `IP: ${MINECRAFT_HOST}`,
  //       },
  //     },
  //   ]);
  // });
  //
  // minecraft.on(EVENTS.MC_SERVER_CLOSED, () => {
  //   discordStatusSender.sendGenericEmbedMessage([
  //     {
  //       title: 'Server is Down',
  //       description: 'Server is temporarily down. see you later',
  //       color: 15548997,
  //     },
  //   ]);
  // });
  //
  // minecraft.on(EVENTS.MC_SERVER_CRASHED, ({ uid }) => {
  //   discordStatusSender.sendGenericEmbedMessage([
  //     {
  //       title: 'Server Crashed',
  //       description: 'The server will start soon',
  //       color: 15548997,
  //       footer: {
  //         text: `UID: ${uid}`,
  //       },
  //     },
  //   ]);
  // });
  //
  // minecraft.on(EVENTS.MC_PLAYER_CHAT, async ({ username, message }) => {
  //   const avatar = getPlayerAvatarUrl(username);
  //
  //   await discordChatSender.sendPlayerMessage(username, avatar, message);
  // });
  //
  // minecraft.on(EVENTS.MC_PLAYER_JOINED, async ({ username }) => {
  //   const avatar = getPlayerAvatarUrl(username, 24);
  //
  //   await discordNotificationSender.sendGenericEmbedMessage([
  //     {
  //       description: `**${username}** joined the game`,
  //       color: 5763719,
  //       thumbnail: {
  //         url: avatar,
  //       },
  //     },
  //   ]);
  // });
  //
  // minecraft.on(EVENTS.MC_PLAYER_ADVANCEMENT, async ({ username, advancement, type }) => {
  //   const types = {
  //     goal: {
  //       text: 'has reached the goal',
  //       color: 5763719,
  //     },
  //     advancement: {
  //       text: 'has made an advancement',
  //       color: 5763719,
  //     },
  //     challenge: {
  //       text: 'has completed the challenge',
  //       color: 7419530,
  //     },
  //   };
  //
  //   const { text, color } = types[type];
  //
  //   await discordNotificationSender.sendGenericEmbedMessage([
  //     {
  //       title: advancement,
  //       description: `**${username}** ${text}.`,
  //       color,
  //     },
  //   ]);
  // });
  //
  // minecraft.on(EVENTS.MC_PLAYER_LEFT, async ({ username }) => {
  //   const avatar = getPlayerAvatarUrl(username, 24);
  //
  //   await discordNotificationSender.sendGenericEmbedMessage([
  //     {
  //       description: `**${username}** left the game`,
  //       color: 15548997,
  //       thumbnail: {
  //         url: avatar,
  //       },
  //     },
  //   ]);
  // });
  //
  // discordChatReceiver.on(EVENTS.DISCORD_USER_CHAT, async ({ username, message }) => {
  //   await rcon.sendMessage(username, message);
  // });
  //
  // if (isCobblemon) {
  //   discordChatReceiver.addCommandHandler('playerlist-cobblemon', () => rcon.sendCommand('list'));
  // }
  //
  // if (isSMP) {
  //   discordChatReceiver.addCommandHandler('playerlist-smp', () => rcon.sendCommand('list'));
  // }
  //
  rcon.connect();
  //
  // discordChatReceiver.login();
};

module.exports = bridge
