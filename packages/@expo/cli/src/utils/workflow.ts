import { AndroidConfig, IOSConfig } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

import getVCSClientAsync from './vcs';

export type Workflow = 'managed' | 'generic' | 'not-configured';

export async function resolveWorkflowAsync(
  projectDir: string,
  platform: 'ios' | 'android'
): Promise<Workflow> {
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
    const isIgnored = await isNativeCodeIgnored(projectDir, platform);

    if (!isIgnored) {
      return 'not-configured';
    }

    return 'generic';
  }

  const vcsRootPath = path.normalize(await vcsClient.getRootPathAsync());
  for (const marker of platformWorkflowMarkers) {
    if (
      fs.existsSync(marker) &&
      !(await vcsClient.isFileIgnoredAsync(path.relative(vcsRootPath, marker)))
    ) {
      return 'generic';
    }
  }
  return 'managed';
}

export async function isNativeCodeIgnored(projectDir: string, platform: 'ios' | 'android') {
  const vcsClient = await getVCSClientAsync(projectDir);
  const vcsRootPath = path.normalize(await vcsClient.getRootPathAsync());

  const platformFolder = platform === 'ios' ? 'ios' : 'android';
  const relativePlatformPath = path.relative(vcsRootPath, path.join(projectDir, platformFolder));

  return await vcsClient.isFileIgnoredAsync(relativePlatformPath);
}

export function validateWorkflow(possibleWorkflow: string): Workflow {
  if (possibleWorkflow === 'managed' || possibleWorkflow === 'generic') {
    return possibleWorkflow;
  }

  throw new Error(`Invalid workflow: ${possibleWorkflow}. Must be either 'managed' or 'generic'`);
}
