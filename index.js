require('dotenv').config();

const logger = require('./src/logger');

const events = require('./src/events');

const { MinecraftLogListener } = require('./src/minecraft/log');
const { getPlayerUuid, getPlayerAvatarUrl } = require('./src/minecraft/player');
const RconWrapper = require('./src/minecraft/rcon-wrapper');

const DiscordWebhookChatSender = require('./src/discord/chat-webhook-sender');
const DiscordChatReceiver = require('./src/discord/chat-receiver');

const {
  MINECRAFT_LOG_FILE,
  MINECRAFT_HOST,
  MINECRAFT_RCON_HOST,
  MINECRAFT_RCON_PORT,
  MINECRAFT_RCON_PASSWORD,
  DISCORD_MINECRAFT_CHAT_CHANNEL_ID,
  DISCORD_MINECRAFT_CHAT_WEBHOOK_URL,
  DISCORD_MINECRAFT_NOTIFICATIONS_WEBHOOK_URL,
  DISCORD_MINECRAFT_BRIDGE_TOKEN,
  DISCORD_MINECRAFT_STATUS_WEBHOOK_URL,
} = process.env;

logger.init();

const minecraft = new MinecraftLogListener(MINECRAFT_LOG_FILE);

const rcon = new RconWrapper(MINECRAFT_RCON_HOST, MINECRAFT_RCON_PORT, MINECRAFT_RCON_PASSWORD);

const discordNotificationSender = new DiscordWebhookChatSender(
  DISCORD_MINECRAFT_NOTIFICATIONS_WEBHOOK_URL,
);

const discordChatSender = new DiscordWebhookChatSender(DISCORD_MINECRAFT_CHAT_WEBHOOK_URL);
const discordStatusSender = new DiscordWebhookChatSender(DISCORD_MINECRAFT_STATUS_WEBHOOK_URL);

const discordChatReceiver = new DiscordChatReceiver(
  DISCORD_MINECRAFT_BRIDGE_TOKEN,
  DISCORD_MINECRAFT_CHAT_CHANNEL_ID,
);

async function main() {
  minecraft.on(events.MC_SERVER_STARTING, () => {
    discordStatusSender.sendGenericEmbedMessage([
      {
        title: 'Starting Server',
        description: 'The server is now starting. Please wait for a few seconds',
        color: 5763719,
      },
    ]);
  });

  minecraft.on(events.MC_SERVER_OPEN, () => {
    discordStatusSender.sendGenericEmbedMessage([
      {
        title: 'Server is Up',
        description: 'You can now connect to Minecraft Server',
        color: 5763719,
        footer: {
          text: `IP: ${MINECRAFT_HOST}`,
        },
      },
    ]);
  });

  minecraft.on(events.MC_SERVER_CLOSED, () => {
    discordStatusSender.sendGenericEmbedMessage([
      {
        title: 'Server is Down',
        description: 'Server is temporarily down. see you later',
        color: 15548997,
      },
    ]);
  });

  minecraft.on(events.MC_SERVER_CRASHED, ({ uid }) => {
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

  minecraft.on(events.MC_PLAYER_CHAT, async ({ username, message }) => {
    const playerUuid = await getPlayerUuid(username);
    const avatar = getPlayerAvatarUrl(playerUuid);

    await discordChatSender.sendPlayerMessage(username, avatar, message);
  });

  minecraft.on(events.MC_PLAYER_JOINED, async ({ username }) => {
    const playerUuid = await getPlayerUuid(username);
    const avatar = getPlayerAvatarUrl(playerUuid);

    await discordNotificationSender.sendPlayerMessage(username, avatar, `**${username}** joined the game`);
  });

  minecraft.on(events.MC_PLAYER_LEFT, async ({ username }) => {
    const playerUuid = await getPlayerUuid(username);
    const avatar = getPlayerAvatarUrl(playerUuid);

    await discordNotificationSender.sendPlayerMessage(username, avatar, `**${username}** left the game`);
  });

  minecraft.on(events.MC_PLAYER_ADVANCEMENT, async ({ username, advancement }) => {
    const playerUuid = await getPlayerUuid(username);
    const avatar = getPlayerAvatarUrl(playerUuid);

    await discordNotificationSender.sendEmbedMessage(username, avatar, [{
      title: `has made the advancement [${advancement}]`,
      color: 5763719,
    }]);
  });

  discordChatReceiver.on(events.DISCORD_USER_CHAT, async ({ username, message }) => {
    await rcon.sendMessage(username, message);
  });

  discordChatReceiver.addCommandHandler('playerlist', () => rcon.sendCommand('list'));

  await rcon.connect();
  await discordChatReceiver.login();
}

main().catch((error) => {
  process.stderr.write(error.stack);
  process.exit(1);
});
