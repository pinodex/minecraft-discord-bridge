require('dotenv').config();
const path = require('path');

const logger = require('./src/lib/logger');
logger.init();

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const bridge = require('./src/bridge');
const discordChatCleaner = require('./src/discord/chat-cleaner');
const {SERVER_IDS_ARR} = require("./src/constants");
const {getServerIds} = require("./src/util/getServerIds");
const {getLoggerInstance} = require("./src/lib/logger");

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
  function loadMatchingRules(id) {
    try {
      const rulesPath = path.resolve(__dirname, `./src/rules/${id}.js`);
      return require(rulesPath);
    } catch (err) {
      console.warn(`Warning: Rules for ${id} not found. Falling back to default.`);
      return require(path.resolve(__dirname, './src/rules/default.js'));
    }
  }

  const serverIds = getServerIds();

  for (const id of serverIds) {
    const isEnabled = process.env[`SERVER_${id}_ENABLED`] === "true"

    if (!isEnabled) continue;

    const logger = getLoggerInstance(id);

    const config = {
      id,
      name: process.env[`SERVER_${id}_MINECRAFT_NAME`] || id,
      host: process.env[`SERVER_${id}_MINECRAFT_HOST`],
      logFile: process.env[`SERVER_${id}_MINECRAFT_LOG_FILE`],
      rcon: {
        host: process.env[`SERVER_${id}_MINECRAFT_RCON_HOST`],
        port: parseInt(process.env[`SERVER_'${id}_MINECRAFT_RCON_PORT`] || '0'),
        password: process.env[`SERVER_${id}_MINECRAFT_RCON_PASSWORD`],
      },
      discord: {
        token: process.env[`SERVER_${id}_DISCORD_BRIDGE_TOKEN`],
        channels: {
          chat: process.env[`SERVER_${id}_DISCORD_CHAT_CHANNEL_ID`],
        },
        webhooks: {
          chat: process.env[`SERVER_${id}_DISCORD_CHAT_WEBHOOK_URL`],
          status: process.env[`SERVER_${id}_DISCORD_STATUS_WEBHOOK_URL`],
          notifications: process.env[`SERVER_${id}_DISCORD_NOTIFICATIONS_WEBHOOK_URL`],
        }
      },
      rules: loadMatchingRules(id)
    }
    logger.info(`Successfully loaded rules for '${id}'.`);
    bridge(config);
  }
}
