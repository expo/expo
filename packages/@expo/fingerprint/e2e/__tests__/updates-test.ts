import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';
import rimraf from 'rimraf';

import { createProjectHashAsync } from '../../src/Fingerprint';

jest.mock('../../src/sourcer/ExpoConfigLoader', () => ({
  // Mock the getExpoConfigLoaderPath to use the built version rather than the typescript version from src
  getExpoConfigLoaderPath: jest.fn(() =>
    jest
      .requireActual('path')
      .resolve(__dirname, '..', '..', 'build', 'sourcer', 'ExpoConfigLoader.js')
  ),
}));

describe('updates managed support', () => {
  jest.setTimeout(600000);
  const tmpDir = require('temp-dir');
  const projectName = 'fingerprint-e2e-updates';
  const projectRoot = path.join(tmpDir, projectName);

  beforeAll(async () => {
    rimraf.sync(projectRoot);
    // Pin the SDK version to prevent the latest version breaking snapshots
    await spawnAsync('bunx', ['create-expo-app', '-t', 'blank@sdk-51', projectName], {
      stdio: 'inherit',
      cwd: tmpDir,
      env: {
        ...process.env,
        // Do not inherit the package manager from this repository
        npm_config_user_agent: undefined,
      },
    });

    // Add appId
    const appConfigPath = path.join(projectRoot, 'app.json');
    const appConfig = JSON.parse(await fs.readFile(appConfigPath, 'utf8'));
    appConfig.expo.android.package = 'dev.expo.fingerprint';
    appConfig.expo.ios.bundleIdentifier = 'dev.expo.fingerprint';
    await fs.writeFile(appConfigPath, JSON.stringify(appConfig, null, 2));
  });

  afterAll(async () => {
    rimraf.sync(projectRoot);
  });

  it('should have same hash before and after prebuild', async () => {
    // Installs the sentry package because sentry has double quoted imports
    // and expo-modules-linking will patch their files during `pod install` phase.
    await spawnAsync('npx', ['expo', 'install', '@sentry/react-native'], {
      stdio: 'ignore',
      cwd: projectRoot,
    });
    const fingerprintHash1 = await createProjectHashAsync(projectRoot, {
      ignorePaths: ['android/**/*', 'ios/**/*'],
    });

    // Reset modules to prevent cached `require(projectRoot/package.json)`
    jest.resetModules();

    await spawnAsync('npx', ['expo', 'prebuild'], {
      stdio: 'ignore',
      cwd: projectRoot,
    });
    const fingerprintHash2 = await createProjectHashAsync(projectRoot, {
      ignorePaths: ['android/**/*', 'ios/**/*'],
    });
    expect(fingerprintHash1).toEqual(fingerprintHash2);
  });
});
