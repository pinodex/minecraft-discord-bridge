const events = require('./events');
const serverIds = require("./serverIds");

module.exports = {
  EVENTS: events,
  SERVER_IDS: serverIds,
  SERVER_IDS_ARR: Object.keys(serverIds).map(key => serverIds[key])
};
