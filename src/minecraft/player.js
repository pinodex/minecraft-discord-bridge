const cacheManager = require('cache-manager');
const axios = require('axios');
const logger = require('../logger');

const cache = cacheManager.caching({
  store: 'memory',
  max: 100,
  ttl: 3600,
});

/**
 * Generic Minecraft Player ID
 * @type {String}
 */
const STEVE_PLAYER_ID = '8667ba71b85a4004af54457a9734eed7';

/**
 * Get Minecraft Player UUID
 *
 * @param  {String} username Minecraft Player Username
 * @return {String}
 */
async function getPlayerUuid(username) {
  return cache.wrap(username, async () => {
    try {
      const url = `https://api.mojang.com/users/profiles/minecraft/${username}`;
      const { data, status } = await axios.get(url);

      if (status !== 200) {
        return null;
      }

      return data.id;
    } catch (e) {
      logger.error(`Error when getting player UUID ${username}: ${e}`);

      return null;
    }
  });
}

/**
 * Get Minecraft Player Avatar URL
 *
 * @param  {String} uuid Minecraft Player UUID
 * @return {String}
 */
function getPlayerAvatarUrl(uuid) {
  if (uuid) {
    return `https://crafatar.com/avatars/${uuid}?size=100`;
  }

  return `https://crafatar.com/avatars/${STEVE_PLAYER_ID}?size=100`;
}

module.exports = {
  getPlayerUuid,
  getPlayerAvatarUrl,
};
