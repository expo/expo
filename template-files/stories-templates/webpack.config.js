const withExpoStories = require('expo-stories/webpack-config');
const { createWebpackConfigAsync } = require('expo-yarn-workspaces/webpack');

module.exports = async function(env, argv) {
  const config = await createWebpackConfigAsync(env, argv);
  return withExpoStories(config, { projectRoot: __dirname });
};
