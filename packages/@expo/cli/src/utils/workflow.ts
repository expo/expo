import { AndroidConfig, IOSConfig } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

import getVCSClientAsync from './vcs';

export type CNGStatus = {
  hasNativeCode: boolean;
  isInGitIgnore: boolean;
  platform: 'ios' | 'android';
};

export async function resolveWorkflowAsync(
  projectDir: string,
  platform: 'ios' | 'android'
): Promise<CNGStatus> {
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
    const isInGitIgnore = await isNativeCodeIgnored(projectDir, platform);

    return { hasNativeCode: false, isInGitIgnore, platform };
  }

  const vcsRootPath = path.normalize(await vcsClient.getRootPathAsync());
  for (const marker of platformWorkflowMarkers) {
    if (
      fs.existsSync(marker) &&
      !(await vcsClient.isFileIgnoredAsync(path.relative(vcsRootPath, marker)))
    ) {
      return { hasNativeCode: true, isInGitIgnore: false, platform };
    }
  }
  return { hasNativeCode: true, isInGitIgnore: true, platform };
}

export async function isNativeCodeIgnored(projectDir: string, platform: 'ios' | 'android') {
  const vcsClient = await getVCSClientAsync(projectDir);
  const vcsRootPath = path.normalize(await vcsClient.getRootPathAsync());

  const platformFolder = platform === 'ios' ? 'ios' : 'android';
  const relativePlatformPath = path.relative(vcsRootPath, path.join(projectDir, platformFolder));

  return await vcsClient.isFileIgnoredAsync(relativePlatformPath);
}
