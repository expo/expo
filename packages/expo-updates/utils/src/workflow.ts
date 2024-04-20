import { AndroidConfig, IOSConfig } from '@expo/config-plugins';
import fs from 'fs-extra';
import path from 'path';

import getVCSClientAsync from './vcs';

export async function resolveWorkflowAsync(
  projectDir: string,
  platform: 'ios' | 'android'
): Promise<'managed' | 'generic'> {
  const vcsClient = await getVCSClientAsync(projectDir);

  let platformWorkflowMarkers: string[];
  try {
    platformWorkflowMarkers =
      platform === 'android'
        ? [
            path.join(projectDir, 'android/app/build.gradle'),
            await AndroidConfig.Paths.getAndroidManifestAsync(projectDir),
          ]
        : [IOSConfig.Paths.getPBXProjectPath(projectDir)];
  } catch {
    return 'managed';
  }

  const vcsRootPath = path.normalize(await vcsClient.getRootPathAsync());
  for (const marker of platformWorkflowMarkers) {
    if (
      (await fs.pathExists(marker)) &&
      !(await vcsClient.isFileIgnoredAsync(path.relative(vcsRootPath, marker)))
    ) {
      return 'generic';
    }
  }
  return 'managed';
}
