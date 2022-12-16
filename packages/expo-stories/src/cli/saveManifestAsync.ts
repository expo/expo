import fse from 'fs-extra';

import { StoryManifest } from '../types';
import { getManifestFilePath } from './shared';

export async function saveManifestAsync(
  storyManifest: StoryManifest,
  config: { watchRoot: string; projectRoot: string }
) {
  const manifestFilePath = getManifestFilePath(config.projectRoot);
  const storyManifestAsString = JSON.stringify(storyManifest, null, '\t');

  await fse.writeFile(manifestFilePath, storyManifestAsString, {
    encoding: 'utf-8',
  });
}
