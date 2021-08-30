const { createMetroConfiguration } = require('expo-yarn-workspaces');

const baseConfig = createMetroConfiguration(__dirname);

module.exports = {
  ...baseConfig,
};
