/**
 * Mapping of event names
 * @type {Object}
 */
module.exports = {
  DISCORD_CLIENT_READY: 'discord.client.ready',
  DISCORD_USER_CHAT: 'discord.user.chat',

  MC_SERVER_MESSAGE: 'mc.server.message',
  MC_SERVER_STARTING: 'mc.server.starting',
  MC_SERVER_OPEN: 'mc.server.open',
  MC_SERVER_CLOSED: 'mc.server.closed',
  MC_SERVER_CRASHED: 'mc.server.crashed',

  MC_PLAYER_CHAT: 'mc.player.chat',
  MC_PLAYER_JOINED: 'mc.player.joined',
  MC_PLAYER_LEFT: 'mc.player.left',
  MC_PLAYER_DISCONNECTED: 'mc.player.disconnected',
  MC_PLAYER_ADVANCEMENT: 'mc.player.advancement',
  MC_PLAYER_MISC: 'mc.player.misc',
};
