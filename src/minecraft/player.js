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
 * @param  {String} user Minecraft Player username or UUID
 * @param  {String} size Minecraft Player Avatar Size
 * @return {String}
 */
function getPlayerAvatarUrl(user, size = 100) {
  if (user) {
    return `https://minotar.net/avatar/${user}/${size}`;
  }

  return `https://minotar.net/avatar/${STEVE_PLAYER_ID}/${size}`;
}

module.exports = {
  getPlayerUuid,
  getPlayerAvatarUrl,
};
