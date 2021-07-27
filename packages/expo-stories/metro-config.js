const { getStoriesCacheDir, getStoriesFile } = require('./build/server/shared');
const { writeRequiredFiles } = require('./build/server/writeRequiredFiles');

function withExpoStories(metroConfig) {
  writeRequiredFiles({
    projectRoot: metroConfig.projectRoot,
  });

  const storiesDir = getStoriesCacheDir(metroConfig);
  const storyFile = getStoriesFile(metroConfig);

  metroConfig.resolver.extraNodeModules['generated-expo-stories'] = storyFile;

  metroConfig.watchFolders.push(storiesDir);

  return metroConfig;
}

module.exports = withExpoStories;
