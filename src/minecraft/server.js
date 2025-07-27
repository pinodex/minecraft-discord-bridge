const { status } = require('minecraft-server-util');
const { Client, GatewayIntentBits } = require('discord.js');
const {getLoggerInstance} = require("../lib/logger");

/**
 * Minecraft server monitor that updates a Discord channel's name based on server status.
 */
class MinecraftStatusMonitor {
  logger;

  /**
   * @param {Object} options
   * @param {string} serverId  Minecraft Server ID
   * @param {string} options.token - Discord bot token.
   * @param {string} options.channelId - ID of the Discord text channel to update.
   * @param {string} options.host - Domain or IP of the Minecraft server.
   * @param {number=} [options.port] - Port of the Minecraft server (optional if SRV is configured).
   * @param {number} [options.intervalMs=300000] - Interval to check server status (default 5 minutes).
   */
  constructor({ serverId, token, channelId, host, port, intervalMs = 5 * 60 * 1000 }) {
    this.logger = getLoggerInstance(serverId);

    this.discordToken = token;
    this.channelId = channelId;
    this.host = host;
    this.port = port;
    this.intervalMs = intervalMs;

    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
    this.channel = null;
  }

  /**
   * Starts the bot and begins the monitoring loop.
   */
  async start() {
    this.client.once('ready', async () => {
      this.logger.info(`✅ Logged in as ${this.client.user.tag}`);
      this.channel = await this.client.channels.fetch(this.channelId);
      if (!this.channel?.isTextBased()) {
        this.logger.error('❌ Channel is not a text channel or could not be found.');
        return;
      }

      await this.checkAndUpdate();

      setInterval(() => {
        this.checkAndUpdate();
      }, this.intervalMs);
    });

    this.client.login(this.discordToken);
  }

  /**
   * Checks Minecraft server status and updates Discord channel name.
   */
  async checkAndUpdate() {
    try {
      const isOnline = await this.pingServer();
      await this.updateChannelName(isOnline);
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
   * Updates the channel name with the server's status.
   * @param {boolean} isOnline
   */
  async updateChannelName(isOnline) {
    if (!this.channel) return;

    const icon = isOnline ? '🟢' : '🔴';
    const newName = `${icon}-mc-${isOnline ? 'online' : 'offline'}`;

    if (this.channel.name !== newName) {
      await this.channel.setName(newName);
      this.logger.info(`#️⃣ Channel renamed to: ${newName}`);
    }
  }
}

module.exports = MinecraftStatusMonitor;
