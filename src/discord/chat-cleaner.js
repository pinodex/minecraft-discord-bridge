const { Client, Intents } = require('discord.js');
const { timeout } = require('../utils');
const logger = require('../logger');

const {
  DISCORD_MINECRAFT_CHAT_CHANNEL_ID,
  DISCORD_MINECRAFT_BRIDGE_TOKEN,
} = process.env;

module.exports = async () => {
  logger.info('Starting Discord Housekeeping');

  const client = new Client({
    intents: [
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGES,
    ],
  });

  logger.debug('Logging in to Discord API');

  try {
    await client.login(DISCORD_MINECRAFT_BRIDGE_TOKEN);

    logger.info('Logged in to Discord API');
  } catch (e) {
    logger.error(`Cannot login to Discord API: ${e}`);
  }

  const channel = await client.channels.fetch(DISCORD_MINECRAFT_CHAT_CHANNEL_ID);

  if (!channel) {
    logger.error(`Cannot find channel ${DISCORD_MINECRAFT_CHAT_CHANNEL_ID}`);

    return;
  }

  /**
   * Collects and deletes the collected messages
   *
   * @param  {String} before Last Discord Message ID from Collection
   */
  const collectAndDeleteMessages = async (before = null) => {
    const messages = await channel.messages.fetch({ before, limit: 100 });

    if (messages.size === 0) {
      return;
    }

    const lastMessage = Array.from(messages.values()).pop();

    logger.info(`Deleting ${messages.size} messages`);

    await channel.bulkDelete(messages);

    if (lastMessage) {
      await timeout(500);
      await collectAndDeleteMessages(lastMessage.id);
    }
  };

  await collectAndDeleteMessages();

  logger.info('Discord channel housekeeping completed');
};
