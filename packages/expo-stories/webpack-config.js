const path = require('path');

const { getStoriesFile } = require('./build/server/shared');
const { writeRequiredFiles } = require('./build/server/writeRequiredFiles');

function withExpoStories(config) {
  writeRequiredFiles(config);

  const storyFile = getStoriesFile(config);

  config.resolve.alias['generated-expo-stories'] = path.resolve(__dirname, storyFile);

  return config;
}

export default withExpoStories;
