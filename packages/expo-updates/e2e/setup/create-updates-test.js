const path = require('path');

const { initAsync, setupManualTestAppAsync } = require('./project');

const repoRoot = process.env.EXPO_REPO_ROOT;
const workingDir = path.resolve(repoRoot, '..');

/*
 * Change this to your own Expo account name
 */
const EXPO_ACCOUNT_NAME = process.env.EXPO_ACCOUNT_NAME || 'myusername';

/**
 * This generates a project at the location TEST_PROJECT_ROOT,
 * set up to use the latest bits from the current repo source,
 * and can be used to test different expo-updates and EAS updates workflows.
 */

function transformAppJson(appJson, projectName, runtimeVersion) {
  return {
    expo: {
      ...appJson.expo,
      name: projectName,
      runtimeVersion,
      jsEngine: 'jsc',
      updates: {
        ...appJson.expo.updates,
        requestHeaders: {
          'expo-channel-name': 'main',
        },
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

  await setupManualTestAppAsync(projectRoot);
})();
