import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import rimraf from 'rimraf';

import { createFingerprintAsync } from '../../src/Fingerprint';

jest.mock('../../src/ExpoConfigLoader', () => ({
  // Mock the getExpoConfigLoaderPath to use the built version rather than the typescript version from src
  getExpoConfigLoaderPath: jest.fn(() =>
    jest.requireActual('path').resolve(__dirname, '..', '..', 'build', 'ExpoConfigLoader.js')
  ),
}));

const macosDescribe = os.platform() === 'darwin' ? describe : describe.skip;

describe('default template ignore paths', () => {
  jest.setTimeout(600000);
  const tmpDir = require('temp-dir');
  const projectName = 'fingerprint-e2e-default-ignore-paths';
  const projectRoot = path.join(tmpDir, projectName);

  beforeAll(async () => {
    rimraf.sync(projectRoot);
    await spawnAsync('bunx', ['create-expo-app', '-t', 'default', projectName], {
      stdio: 'inherit',
      cwd: tmpDir,
      env: {
        ...process.env,
        // Do not inherit the package manager from this repository
        npm_config_user_agent: undefined,
      },
    });
  });

  afterAll(async () => {
    rimraf.sync(projectRoot);
  });

  it('should not contain non-native node modules', async () => {
    const fingerprint = await createFingerprintAsync(projectRoot);
    for (const source of fingerprint.sources) {
      if (source.type === 'contents') {
        continue;
      }
      const { filePath } = source;
      const nodeModulesIndex = filePath.indexOf('node_modules' + path.sep);
      if (nodeModulesIndex < 0) {
        continue;
      }
      const moduleName = filePath.split(path.sep)[1];

      // Heuristic to check if it's a native module
      // We ignore expo modules first and then check react-native- prefix.
      if (moduleName === 'expo' || moduleName === '@expo' || moduleName.startsWith('expo-')) {
        continue;
      }
      expect(moduleName).toMatch(/^(react-native-)/);
    }
  });

  it('should not include the whole project package.json from ExpoConfigLoader', async () => {
    const appConfigPath = path.join(projectRoot, 'app.config.js');
    const appConfigContent = `\
const { version } = require('./package.json');

export default ({ config }) => {
  config.version = version;
  return config;
};
`;
    await fs.writeFile(appConfigPath, appConfigContent);
    const fingerprint = await createFingerprintAsync(projectRoot);
    const packageJsonSource = fingerprint.sources.find(
      (source) =>
        source.type === 'file' &&
        source.filePath === 'package.json' &&
        source.reasons.includes('expoConfigPlugins')
    );
    expect(packageJsonSource).toBeUndefined();
    await fs.rm(appConfigPath, { force: true });
  });
});

macosDescribe('CocoaPods generated files', () => {
  const tmpDir = require('temp-dir');
  const projectName = 'fingerprint-e2e-cocoapods-generated-files';
  const projectRoot = path.join(tmpDir, projectName);

  beforeAll(async () => {
    rimraf.sync(projectRoot);
    await spawnAsync('bunx', ['create-expo-app', '-t', 'default', projectName], {
      stdio: 'inherit',
      cwd: tmpDir,
      env: {
        ...process.env,
        // Do not inherit the package manager from this repository
        npm_config_user_agent: undefined,
      },
    });
    const appJsonPath = path.join(projectRoot, 'app.json');
    const config = JSON.parse(await fs.readFile(appJsonPath, 'utf8'));
    config.expo.ios.bundleIdentifier = 'com.example.test';
    config.expo.android.package = 'com.example.test';
    await fs.writeFile(appJsonPath, JSON.stringify(config, null, 2));
    await fs.writeFile(
      path.join(projectRoot, '.fingerprintignore'),
      `\
android/**/*
ios/**/*
`
    );
  });

  afterAll(async () => {
    rimraf.sync(projectRoot);
  });

  it('should ignore pod install generated files', async () => {
    // expo-sqlite and expo-updates have dynamic copied files, which should be ignored by fingerprinting.
    // https://github.com/expo/expo/blob/d0e39858ead9a194d90990f89903e773b9d33582/packages/expo-sqlite/ios/ExpoSQLite.podspec#L25-L36
    // https://github.com/expo/expo/blob/d0e39858ead9a194d90990f89903e773b9d33582/packages/expo-updates/ios/EXUpdates.podspec#L51-L58
    await spawnAsync('npx', ['expo', 'install', 'expo-sqlite', 'expo-updates'], {
      stdio: 'ignore',
      cwd: projectRoot,
    });
    const fingerprint = await createFingerprintAsync(projectRoot);
    await spawnAsync('npx', ['expo', 'prebuild', '--platform', 'ios', '--no-install'], {
      stdio: 'ignore',
      cwd: projectRoot,
    });
    await spawnAsync('npx', ['pod-install'], {
      stdio: 'ignore',
      cwd: projectRoot,
    });
    const fingerprint2 = await createFingerprintAsync(projectRoot);
    expect(fingerprint.hash).toBe(fingerprint2.hash);
  });
});
