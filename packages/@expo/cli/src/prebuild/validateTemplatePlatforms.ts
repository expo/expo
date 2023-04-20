import { ModPlatform } from '@expo/config-plugins';
import path from 'path';

import * as Log from '../log';
import { directoryExistsAsync } from '../utils/dir';

export async function validateTemplatePlatforms({
  templateDirectory,
  platforms,
}: {
  templateDirectory: string;
  platforms: ModPlatform[];
}) {
  const existingPlatforms: ModPlatform[] = [];

  for (const platform of platforms) {
    if (await directoryExistsAsync(path.join(templateDirectory, platform))) {
      existingPlatforms.push(platform);
    } else {
      Log.warn(
        `The template does not contain native files for ${platform} (./${platform}), skipping platform`
      );
    }
  }

  return existingPlatforms;
}
