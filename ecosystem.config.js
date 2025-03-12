const path = require('path');

module.exports = {
  apps: [
    {
      name: path.basename(__dirname),
      script: './index.js',
    },
  ],
};
