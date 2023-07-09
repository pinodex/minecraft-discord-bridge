module.exports = {
  apps: [
    {
      name: 'minecraft-discord-bridge-bot',
      script: './index.js',
    },
    {
      name: 'minecraft-discord-bridge-housekeeping',
      script: './index.js',
      args: '--discord-housekeeping',
      cron_restart: '0 8 * * *',
    },
  ],
};
