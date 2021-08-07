require('dotenv').config();

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const logger = require('./src/logger');
const bridge = require('./src/bridge');
const discordChatCleaner = require('./src/discord/chat-cleaner');

logger.init();

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
  bridge();
}
