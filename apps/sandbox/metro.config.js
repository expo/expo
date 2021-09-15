const { createMetroConfiguration } = require('expo-yarn-workspaces');

module.exports = createMetroConfiguration(__dirname);

// uncomment below to enable expo stories

// const withExpoStories = require('expo-stories/metro-config')
// module.exports = withExpoStories(createMetroConfiguration(__dirname));
