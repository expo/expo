import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';
import rimraf from 'rimraf';

import getFingerprintHashFromCLIAsync from './utils/CLIUtils';
import {
  createFingerprintAsync,
  createProjectHashAsync,
  diffFingerprintChangesAsync,
} from '../../src/Fingerprint';
import { normalizeOptionsAsync } from '../../src/Options';
import { getHashSourcesAsync } from '../../src/sourcer/Sourcer';

jest.mock('../../src/sourcer/ExpoConfigLoader', () => ({
  // Mock the getExpoConfigLoaderPath to use the built version rather than the typescript version from src
  getExpoConfigLoaderPath: jest.fn(() =>
    jest
      .requireActual('path')
      .resolve(__dirname, '..', '..', 'build', 'sourcer', 'ExpoConfigLoader.js')
  ),
}));

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
      const nodeModulesIndex = filePath.indexOf('node_modules/');
      if (nodeModulesIndex < 0) {
        continue;
      }
      const moduleName = filePath.split('/')[1];

      // Heuristic to check if it's a native module
      // We ignore expo modules first and then check react-native- prefix.
      if (moduleName === 'expo' || moduleName === '@expo' || moduleName.startsWith('expo-')) {
        continue;
      }
      expect(moduleName).toMatch(/^(react-native-)/);
    }
  });
});
