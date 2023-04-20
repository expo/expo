import { ModPlatform } from '@expo/config-plugins';
import chalk from 'chalk';
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
        chalk`⚠️  Skipping platform ${platform}. Use a template that contains native files for ${platform} (./${platform}).`
      );
    }
  }

  return existingPlatforms;
}
