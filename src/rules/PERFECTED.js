const { EVENTS } = require('../constants')

/**
 * List of match rules
 * @type {Rule[]}
 */
module.exports = [
  {
    type: EVENTS.MC_SERVER_MESSAGE,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\] \[minecraft\/MinecraftServer\]: \[Server\] (.*)/,
    handler(matches) {
      const [timestamp, message] = matches.slice(1);

      return { timestamp, message };
    },
  },
  {
    type: EVENTS.MC_SERVER_STARTING,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[main\/INFO\]: Loading Minecraft (.*) with Fabric Loader (.*)/,
    handler(matches) {
      const [timestamp] = matches.slice(1);

      return { timestamp };
    },
  },
  {
    type: EVENTS.MC_SERVER_OPEN,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: Done/,
    handler(matches) {
      const [timestamp] = matches.slice(1);

      return { timestamp };
    },
  },
  {
    type: EVENTS.MC_SERVER_CLOSED,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: Stopping server/,
    handler(matches) {
      const [timestamp] = matches.slice(1);

      return { timestamp };
    },
  },
  {
    type: EVENTS.MC_SERVER_CRASHED,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/FATAL\]: Preparing crash report with UUID (.*)/,
    handler(matches) {
      const [timestamp, uid] = matches.slice(1);

      return { timestamp, uid };
    },
  },
  {
    type: EVENTS.MC_PLAYER_CHAT,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: \<(\w+)\> (.*)/,
    handler(matches) {
      const [timestamp, username, message] = matches.slice(1);

      return { timestamp, username, message };
    },
  },
  {
    type: EVENTS.MC_PLAYER_ADVANCEMENT,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: (\w+) has made the advancement \[(.*)]/,
    handler(matches) {
      const [timestamp, username, advancement] = matches.slice(1);

      return {
        timestamp,
        username,
        advancement,
        type: 'advancement',
      };
    },
  },
  {
    type: EVENTS.MC_PLAYER_ADVANCEMENT,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: (\w+) has reached the goal \[(.*)]/,
    handler(matches) {
      const [timestamp, username, advancement] = matches.slice(1);

      return {
        timestamp,
        username,
        advancement,
        type: 'goal',
      };
    },
  },
  {
    type: EVENTS.MC_PLAYER_ADVANCEMENT,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: (\w+) has completed the challenge \[(.*)]/,
    handler(matches) {
      const [timestamp, username, advancement] = matches.slice(1);

      return {
        timestamp,
        username,
        advancement,
        type: 'challenge',
      };
    },
  },
  {
    type: EVENTS.MC_PLAYER_JOINED,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: (\w+) joined the game/,
    handler(matches) {
      const [timestamp, username] = matches.slice(1);

      return { timestamp, username };
    },
  },
  {
    type: EVENTS.MC_PLAYER_LEFT,
    /* eslint no-useless-escape: off */
    pattern:
      /\[(.*)\] \[Server thread\/INFO\]: (\w+) left the game/,
    handler(matches) {
      const [timestamp, username] = matches.slice(1);

      return { timestamp, username };
    },
  },
];
