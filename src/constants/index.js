const events = require('./events');
const serverKeys = require("./serverKeys");

module.exports = {
  EVENTS: events,
  SERVER_KEYS: serverKeys,
  SERVER_KEYS_ARR: Object.keys(serverKeys).map(key => serverKeys[key])
};
