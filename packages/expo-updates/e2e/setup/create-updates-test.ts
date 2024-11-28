#!/usr/bin/env yarn --silent ts-node --transpile-only

import nullthrows from 'nullthrows';
import path from 'path';

import { initAsync, setupManualTestAppAsync, EXPO_ACCOUNT_NAME } from './project';

const repoRoot = nullthrows(process.env.EXPO_REPO_ROOT, 'EXPO_REPO_ROOT is not defined');
const workingDir = path.resolve(repoRoot, '..');

/**
 * This generates a project at the location TEST_PROJECT_ROOT,
 * set up to use the latest bits from the current repo source,
 * and can be used to test different expo-updates and EAS updates workflows.
 */

function transformAppJson(appJson: any, projectName: string, runtimeVersion: string): any {
  return {
    expo: {
      ...appJson.expo,
      name: projectName,
      runtimeVersion,
      updates: {
        ...appJson.expo.updates,
        requestHeaders: {
          'expo-channel-name': 'main',
        },
        assetPatternsToBeBundled: ['assetsInUpdates/*'],
      },
      android: {
        ...appJson.expo.android,
        package: `com.${EXPO_ACCOUNT_NAME}.${projectName}`,
      },
      ios: {
        ...appJson.expo.ios,
        bundleIdentifier: `com.${EXPO_ACCOUNT_NAME}.${projectName}`,
      },
    },
  };
}

(async function () {
  if (!process.env.EXPO_REPO_ROOT) {
    throw new Error('Missing one or more environment variables; see instructions in e2e/README.md');
  }
  const projectRoot = process.env.TEST_PROJECT_ROOT || path.join(workingDir, 'updates-e2e');
  const localCliBin = path.join(repoRoot, 'packages/@expo/cli/build/bin/cli');
  const runtimeVersion = '1.0.0';
  await initAsync(projectRoot, {
    repoRoot,
    runtimeVersion,
    localCliBin,
    configureE2E: false,
    transformAppJson,
  });

  await setupManualTestAppAsync(projectRoot, repoRoot);
})();
