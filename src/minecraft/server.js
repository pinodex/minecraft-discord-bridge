const { status } = require('minecraft-server-util');
const { Client, Intents } = require('discord.js');
const {getLoggerInstance} = require("../lib/logger");
const cron = require('node-cron');

/**
 * Minecraft server monitor that updates a Discord channel's name based on server status.
 */
class MinecraftStatusMonitor {
  logger;

  /**
   * @param {Object} options
   * @param {string} options.serverId  Minecraft Server ID
   * @param {string} options.token - Discord bot token.
   * @param {string} options.categoryId - ID of the Discord category to update.
   * @param {string} options.host - Domain or IP of the Minecraft server.
   * @param {number=} [options.port] - Port of the Minecraft server (optional if SRV is configured).
   * @param {string} [options.cronExpression='* * * * *'] - Interval to check server status (default 5 minutes).
   */
  constructor({ serverId, token, categoryId, host, port, cronExpression = "* * * * *" }) {
    this.logger = getLoggerInstance(serverId);

    this.discordToken = token;
    this.categoryId = categoryId;
    this.host = host;
    this.port = port;
    this.cronExpression = cronExpression;

    this.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS
      ]
    });
    this.category = null;
  }

  /**
   * Starts the bot and begins the monitoring loop.
   */
  async start() {
    this.client.once('ready', async () => {
      this.logger.info(`Starting Server Status Monitoring...`);

      this.logger.info(`✅ Logged in as ${this.client.user.tag}`);

      this.category = await this.fetchCategory();

      if (!this.category || this.category.type !== "GUILD_CATEGORY") {
        this.logger.error('Not a valid category channel. Category ID:', this.categoryId);

        return;
      }

      await this.checkAndUpdate();

      // Schedule a job to run every minute
      cron.schedule(this.cronExpression, async () => {
        await this.checkAndUpdate();
      });

      this.logger.info(`Server Status Monitoring is now running`);
    });

    this.client.login(this.discordToken);
  }

  /**
   * Checks Minecraft server status and updates Discord category name.
   */
  async checkAndUpdate() {
    try {
      const isOnline = await this.pingServer();

      await this.updateCategoryName(isOnline);
    } catch (err) {
      this.logger.error('❌ Failed to check/update status:', err);
    }
  }

  /**
   * Pings the Minecraft server.
   * @returns {Promise<boolean>}
   */
  async pingServer() {
    try {
      const res = await status(this.host, this.port, { timeout: 3000 });
      return !!res;
    } catch (error) {
      return false;
    }
  }

  /**
   * Updates the category name with the server's status.
   * @param {boolean} isOnline
   */
  async updateCategoryName(isOnline) {
    const baseName = this.category.name.replace(/^([🟢🔴])\s*/, '');
    const icon = isOnline ? '🟢' : '🔴';
    const newName = `${icon} ${baseName}`;

    if (this.category.name.includes(icon)) return;

    await this.category.setName(newName);
    this.logger.info(`✅ Category renamed to: ${newName}`);
  }

  /**
   * Fetch the specified Discord Category ID
   *
   * @return {Discord.GuildCategory}
   */
  async fetchCategory() {
    this.logger.debug(`Fetching Discord Category Channel ID ${this.categoryId}`);

    try {
      const category = await this.client.channels.fetch(this.categoryId);

      this.logger.info(`Fetched Discord Category Channel. Category ID: ${category.id}`);

      return category;
    } catch (e) {
      this.logger.error(`Cannot fetch Discord Category Channel: ${e}`);
    }

    return null;
  }
}

module.exports = MinecraftStatusMonitor;
