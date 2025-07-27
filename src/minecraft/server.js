const { status } = require('minecraft-server-util');
const { Client, Intents } = require('discord.js');
const {getLoggerInstance} = require("../lib/logger");
const cron = require('node-cron');
const mcs = require("node-mcstatus");

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
   * @param {number} [options.port] - Port of the Minecraft server (optional if SRV is configured).
   * @param {string} [options.cronExpression='* * * * *'] - Interval to check server status (default 5 minutes).
   */
  constructor({ serverId, token, categoryId, port, cronExpression = "* * * * *" }) {
    this.logger = getLoggerInstance(serverId);

    this.discordToken = token;
    this.categoryId = categoryId;
    this.port = port;
    this.cronExpression = cronExpression;

    this.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS
      ]
    });
    this.category = null;
    this.hosts = process.env.HOSTS;

    this.logger.debug(`Active Hosts - ${this.hosts}`);
  }

  /**
   * Starts the bot and begins the monitoring loop.
   */
  async start() {
    this.client.once('ready', async () => {
      this.logger.debug(`Starting Server Status Monitoring...`);

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
      const result = await this.pingServer();

      await this.updateCategoryName(result);
    } catch (err) {
      this.logger.error('❌ Failed to check/update status:', err);
    }
  }

  /**
   * Pings the Minecraft server.
   * @returns {{ online: boolean, players?: { max: number, online: number }}}
   */
  async pingServer() {
    try {
      if (!this.hosts || !this.port) throw new Error('Hosts and Port is required.');

      const hosts = this.hosts.split(",");

      const results = await Promise.all(hosts.map(async (host) => mcs.statusJava(host, this.port, { query: true })));

      const onlineHost = results.find((result) => result.online);

      if (!onlineHost) return {
        online: results?.[0]?.online ?? false,
        players: results?.[0]?.players
      };

      return {
        online: onlineHost?.online ?? false,
        players: onlineHost?.players
      };
    } catch (error) {
      return { online: false };
    }
  }

  /**
   * Updates the category name with the server's status.
   * @param {{ online: boolean, players: { max: number, online: number }}} result
   */
  async updateCategoryName({ online, players }) {
    let baseName = this.category.name.replace(/^([🟢🔴])\s*/, '').replace(/\s*\(\d+\/\d+\)/, '');

    const icon = online ? '🟢' : '🔴';
    const onlinePlayers = players?.online ?? 0;
    const maxPlayers = players?.max ?? 0;

    const playerCountLabel = onlinePlayers <= 0 && maxPlayers <= 0 ? '' : `(${onlinePlayers}/${maxPlayers})`

    const newName = `${icon} ${baseName} ${playerCountLabel}`.trim();

    console.log("newName", newName, online, players.online)

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
      const category = await this.client.channels.fetch(this.categoryId, { force: true });

      this.logger.info(`Fetched Discord Category Channel. Category ID: ${category.id}`);

      return category;
    } catch (e) {
      this.logger.error(`Cannot fetch Discord Category Channel: ${e}`);
    }

    return null;
  }

  static parsePlayerListResponse(str) {
    const match = str.match(/There are (\d+) of a max of (\d+)/);

    if (match) {
      const currentPlayers = parseInt(match[1], 10);
      const maxPlayers = parseInt(match[2], 10);
      return {
        online: currentPlayers,
        max: maxPlayers,
      };
    } else {
      return undefined
    }
  }
}

module.exports = MinecraftStatusMonitor;
