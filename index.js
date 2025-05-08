require('dotenv').config();

const logger = require('./src/lib/logger');
logger.init();

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const bridge = require('./src/bridge');
const discordChatCleaner = require('./src/discord/chat-cleaner');
const {SERVER_IDS_ARR} = require("./src/constants");

const { argv } = yargs(hideBin(process.argv));
const { discordHousekeeping } = argv;

if (discordHousekeeping) {
  discordChatCleaner()
    .then(() => process.exit(0))
    .catch((error) => {
      process.stderr.write(error.stack);
      process.exit(1);
    });
} else {
  const configs = SERVER_IDS_ARR.filter((id) => !!process.env[`${id}_MINECRAFT_HOST`]).map((id) => ({
    id,
    name: process.env[`${id}_MINECRAFT_NAME`] || id,
    host: process.env[`${id}_MINECRAFT_HOST`],
    logFile: process.env[`${id}_MINECRAFT_LOG_FILE`],
    rcon: {
      host: process.env[`${id}_MINECRAFT_RCON_HOST`],
      port: parseInt(process.env[`${id}_MINECRAFT_RCON_PORT`] || '0'),
      password: process.env[`${id}_MINECRAFT_RCON_PASSWORD`],
    },
    discord: {
      token: process.env[`${id}_DISCORD_BRIDGE_TOKEN`],
      channels: {
        chat: process.env[`${id}_DISCORD_CHAT_CHANNEL_ID`],
      },
      webhooks: {
        chat: process.env[`${id}_DISCORD_CHAT_WEBHOOK_URL`],
        status: process.env[`${id}_DISCORD_STATUS_WEBHOOK_URL`],
        notifications: process.env[`${id}_DISCORD_NOTIFICATIONS_WEBHOOK_URL`],
      }
    },
  }));

  console.log(`Active Server Configs: ${configs.map((c) => c.id).join(", ")}`)

  configs.forEach((config) => {
    bridge(config);
  });
}
