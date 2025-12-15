import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';
import rimraf from 'rimraf';

import { getFingerprintFromCLIAsync } from './utils/CLIUtils';
import {
  createFingerprintAsync,
  createProjectHashAsync,
  diffFingerprintChangesAsync,
} from '../../src/Fingerprint';
import { normalizeOptionsAsync } from '../../src/Options';
import { getHashSourcesAsync } from '../../src/sourcer/Sourcer';

jest.mock('../../src/ExpoConfigLoader', () => ({
  // Mock the getExpoConfigLoaderPath to use the built version rather than the typescript version from src
  getExpoConfigLoaderPath: jest.fn(() =>
    jest.requireActual('path').resolve(__dirname, '..', '..', 'build', 'ExpoConfigLoader.js')
  ),
}));

const EXPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..');
const BARE_EXPO_APP_ROOT = path.join(EXPO_ROOT, 'apps', 'bare-expo');

describe('relative paths test', () => {
  jest.setTimeout(600000);

  it('should not include absolute paths in the whole fingerprint', async () => {
    const fingerprint = await getFingerprintFromCLIAsync(BARE_EXPO_APP_ROOT);
    const fingerprintString = JSON.stringify(fingerprint);
    expect(fingerprintString).not.toContain(EXPO_ROOT);
  });
});
