const path = require('path');

const { buildAsync } = require('./build/cli/commands/build');
const { initAsync } = require('./build/cli/commands/init');
const { getStoriesDir, getStoriesFile } = require('./build/cli/shared');

async function withExpoStories(metroConfig) {
  const { projectRoot } = metroConfig;

  const pkg = require(path.resolve(projectRoot, 'package.json'));

  const storyConfig = pkg.expoStories || {
    projectRoot,
    watchRoot: projectRoot,
  };

  await initAsync({
    projectRoot: metroConfig.projectRoot,
  });

  await buildAsync(storyConfig);

  const storiesDir = getStoriesDir(metroConfig);
  const storyFile = getStoriesFile(metroConfig);

  metroConfig.resolver.extraNodeModules['generated-expo-stories'] = storyFile;
  metroConfig.watchFolders.push(storiesDir);

  return metroConfig;
}

module.exports = withExpoStories;
