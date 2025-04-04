import { AndroidConfig, IOSConfig } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

import getVCSClientAsync from './vcs';

export type Workflow = 'managed' | 'generic';

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
    return 'managed';
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

export function validateWorkflow(possibleWorkflow: string): Workflow {
  if (possibleWorkflow === 'managed' || possibleWorkflow === 'generic') {
    return possibleWorkflow;
  }

  throw new Error(`Invalid workflow: ${possibleWorkflow}. Must be either 'managed' or 'generic'`);
}
