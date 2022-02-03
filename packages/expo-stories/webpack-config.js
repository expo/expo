const path = require('path');

const { getStoriesFile } = require('./build/server/shared');
const { writeRequiredFiles } = require('./build/server/writeRequiredFiles');

function withExpoStories(config, { projectRoot }) {
  writeRequiredFiles({ projectRoot });

  const storyFile = getStoriesFile({ projectRoot });

  config.resolve.alias['generated-expo-stories'] = path.resolve(projectRoot, storyFile);

  return config;
}

module.exports = withExpoStories;
