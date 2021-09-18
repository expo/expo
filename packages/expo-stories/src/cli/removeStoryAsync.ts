import path from 'path';

import { StoryOptions } from '../types';
import { saveManifestAsync } from './saveManifestAsync';
import { getStoryManifest, hashPath } from './shared';
import { writeStoriesAsync } from './writeStoriesAsync';

export async function removeStoryAsync(relPath: string, config: StoryOptions) {
  const { watchRoot, projectRoot } = config;

  // 1. retrieve saved story manifest
  const storyManifest = getStoryManifest(projectRoot);

  // 2. remove story based on provided relative file path
  const fullPath = path.resolve(watchRoot, relPath);
  const id = hashPath(fullPath);
  delete storyManifest.files[id];

  // 3. save updated manifest file to disk
  await saveManifestAsync(storyManifest, config);

  // 4. write js file based on updated manifest
  await writeStoriesAsync(config);
}
