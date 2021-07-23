const path = require('path');

const { storiesFileDir } = require('./build/server/constants');
const { writeRequiredFiles } = require('./build/server/writeRequiredFiles');

function withExpoStories(config) {
  writeRequiredFiles({
    projectRoot: metroConfig.projectRoot,
  });

  config.resolve.alias['generated-expo-stories'] = path.resolve(
    __dirname,
    `${storiesFileDir}/stories.js`
  );

  return config;
}

export default withExpoStories;
