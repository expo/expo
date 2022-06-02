import { ModPlatform } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

import { promptToClearMalformedNativeProjectsAsync } from '../prebuild/clearNativeFolder';
import { prebuildAsync } from '../prebuild/prebuildAsync';
import { profile } from '../utils/profile';

export async function ensureNativeProjectAsync(
  projectRoot: string,
  { platform, install }: { platform: ModPlatform; install?: boolean }
) {
  // If the user has an empty android folder then the project won't build, this can happen when they delete the prebuild files in git.
  // Check to ensure most of the core files are in place, and prompt to remove the folder if they aren't.
  await profile(promptToClearMalformedNativeProjectsAsync)(projectRoot, [platform]);

  // If the project doesn't have native code, prebuild it...
  if (!fs.existsSync(path.join(projectRoot, platform))) {
    await prebuildAsync(projectRoot, {
      install: !!install,
      platforms: [platform],
    });
  } else {
    return true;
  }
  return false;
}
