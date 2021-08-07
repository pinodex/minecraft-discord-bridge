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
  MINECRAFT_RCON_HOST,
  MINECRAFT_RCON_PORT,
  MINECRAFT_RCON_PASSWORD,
  DISCORD_MINECRAFT_CHAT_CHANNEL_ID,
  DISCORD_MINECRAFT_CHAT_WEBHOOK_URL,
  DISCORD_MINECRAFT_NOTIFICATIONS_WEBHOOK_URL,
  DISCORD_MINECRAFT_BRIDGE_TOKEN,
} = process.env;

logger.init();

const minecraft = new MinecraftLogListener(MINECRAFT_LOG_FILE);

const rcon = new RconWrapper(MINECRAFT_RCON_HOST, MINECRAFT_RCON_PORT, MINECRAFT_RCON_PASSWORD);

const discordNotificationSender = new DiscordWebhookChatSender(
  DISCORD_MINECRAFT_NOTIFICATIONS_WEBHOOK_URL,
);

const discordChatSender = new DiscordWebhookChatSender(DISCORD_MINECRAFT_CHAT_WEBHOOK_URL);

const discordChatReceiver = new DiscordChatReceiver(
  DISCORD_MINECRAFT_BRIDGE_TOKEN,
  DISCORD_MINECRAFT_CHAT_CHANNEL_ID,
);

async function main() {
  await rcon.connect();
  await discordChatReceiver.login();

  minecraft.on(events.MC_PLAYER_CHAT, async ({ username, message }) => {
    const playerUuid = await getPlayerUuid(username);
    const avatar = getPlayerAvatarUrl(playerUuid);

    await discordChatSender.sendPlayerMessage(`Minecraft: ${username}`, avatar, message);
  });

  minecraft.on(events.MC_PLAYER_JOINED, ({ username }) => {
    discordNotificationSender.sendGenericMessage(`${username} joined.`);
  });

  minecraft.on(events.MC_PLAYER_DISCONNECTED, ({ username }) => {
    discordNotificationSender.sendGenericMessage(`${username} disconnected.`);
  });

  minecraft.on(events.MC_PLAYER_MISC, ({ username, message }) => {
    discordNotificationSender.sendGenericMessage(`${username} ${message}.`);
  });

  minecraft.on(events.MC_SERVER_MESSAGE, ({ message }) => {
    discordNotificationSender.sendGenericMessage(message);
  });

  discordChatReceiver.on(events.DISCORD_USER_CHAT, async ({ username, message }) => {
    await rcon.sendMessage(username, message);
  });
}

main().catch((error) => {
  process.stderr.write(error.stack);
  process.exit(1);
});
