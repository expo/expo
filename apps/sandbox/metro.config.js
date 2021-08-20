const withExpoStories = require('expo-stories/metro-config')
const { createMetroConfiguration } = require('expo-yarn-workspaces');

module.exports = withExpoStories(createMetroConfiguration(__dirname));
