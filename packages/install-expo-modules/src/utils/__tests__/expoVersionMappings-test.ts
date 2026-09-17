import fs from 'fs';
import os from 'os';
import path from 'path';

import { getDefaultSdkVersion } from '../expoVersionMappings';

describe(getDefaultSdkVersion, () => {
  let projectRoot: string;

  function setupReactNativeVersionMock(version: string) {
    const packageDir = path.join(projectRoot, 'node_modules', 'react-native');
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify({ version }));
  }

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'install-expo-modules-'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it.each([
    ['0.88.0-rc.0', '58.0.0'],
    ['0.88.0', '58.0.0'],
    ['0.86.3', '57.0.0'],
    ['0.85.0', '56.0.0'],
    ['0.83.0', '55.0.0'],
    ['0.81.5-2', '54.0.0'],
    ['0.81.0', '54.0.0'],
    ['0.79.0', '53.0.0'],
    ['0.78.0', '53.0.0'],
    ['0.77.0', '52.0.0'],
    ['0.76.0', '52.0.0'],
    ['0.68.0', '45.0.0'],
    ['0.65.0', '45.0.0'],
    ['0.64.3', '44.0.0'],
  ])(
    'should resolve as sdk %s from react-native %s project',
    async (reactNativeVersion, expectedSdkVersion) => {
      setupReactNativeVersionMock(reactNativeVersion);
      expect(getDefaultSdkVersion(projectRoot).sdkVersion).toBe(expectedSdkVersion);
    }
  );

  it.each([
    // explicitly not supported versions
    ['0.87.0'],
    ['0.84.0'],
    ['0.80.0'],
    // future versions
    ['1.0.0'],
    ['0.199.0'],
  ])(
    'should throw "Unable to find compatible expo sdk version" for react-native %s',
    async (reactNativeVersion) => {
      setupReactNativeVersionMock(reactNativeVersion);
      expect(() => getDefaultSdkVersion(projectRoot)).toThrow(
        'Unable to find compatible Expo SDK version'
      );
    }
  );
});
