import fse from 'fs-extra';
import path from 'path';

import { StoryOptions } from '../../types';
import { getStoriesDir } from '../shared';

export async function initAsync(config: StoryOptions) {
  const { projectRoot, watchRoot } = config;

  const pathToStories = getStoriesDir(config);

  if (!fse.existsSync(pathToStories)) {
    await fse.mkdir(pathToStories, { recursive: true });
  }

  const pathToStoryFile = path.resolve(pathToStories, 'stories.js');

  if (!fse.existsSync(pathToStoryFile)) {
    await fse.writeFile(pathToStoryFile, 'module.exports = {}', {
      encoding: 'utf-8',
    });
  }

  const pathToStoryManifest = path.resolve(pathToStories, 'storyManifest.json');

  if (fse.existsSync(pathToStoryManifest)) {
    const storyManifest = require(pathToStoryManifest);

    if (storyManifest.watchRoot !== watchRoot || storyManifest.projectRoot !== projectRoot) {
      await fse.unlink(pathToStoryManifest);
    }
  }

  const emptyManifest = {
    watchRoot,
    projectRoot,
    files: {},
  };

  const emptyManifestAsString = JSON.stringify(emptyManifest, null, '\t');

  delete require.cache[pathToStoryManifest];

  await fse.writeFile(pathToStoryManifest, emptyManifestAsString, {
    encoding: 'utf-8',
  });
}
