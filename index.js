require('dotenv').config();

const logger = require('./src/lib/logger');
logger.init();

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const bridge = require('./src/bridge');
const discordChatCleaner = require('./src/discord/chat-cleaner');

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
