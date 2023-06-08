import { getPackageJson } from '@expo/config';
import { vol } from 'memfs';

import { asMock } from '../../../__tests__/asMock';
import {
  hasRequiredAndroidFilesAsync,
  hasRequiredIOSFilesAsync,
} from '../../../prebuild/clearNativeFolder';
import { findUnbundledNativeModulesAsync } from '../../doctor/dependencies/validateDependenciesVersions';
import { isExpoGoCompatibleAsync, getProjectStateAsync } from '../projectState';

jest.mock('@expo/config');
jest.mock('fs', () => jest.requireActual('memfs').fs);
jest.mock('../../doctor/dependencies/validateDependenciesVersions', () => ({
  ...jest.requireActual('../../doctor/dependencies/validateDependenciesVersions'),
  findUnbundledNativeModulesAsync: jest.fn(() => []),
}));
jest.mock('../../../prebuild/clearNativeFolder', () => ({
  ...jest.requireActual('../../../prebuild/clearNativeFolder'),
  hasRequiredAndroidFilesAsync: jest.fn().mockResolvedValue(false),
  hasRequiredIOSFilesAsync: jest.fn().mockResolvedValue(false),
}));

describe(getProjectStateAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return customized=false from project with only js and json files', async () => {
    vol.fromJSON(
      {
        'app.json': '{}',
        'App.js': 'console.log("hello")',
      },
      '/app'
    );
    expect((await getProjectStateAsync('/app')).customized).toBe(false);
  });

  it('should return customized=true from project with android files', async () => {
    vol.fromJSON(
      {
        'app.json': '{}',
        'App.js': 'console.log("hello")',
      },
      '/app'
    );
    asMock(hasRequiredAndroidFilesAsync).mockResolvedValueOnce(true);
    expect((await getProjectStateAsync('/app')).customized).toBe(true);
  });

  it('should return customized=true from project with ios files', async () => {
    vol.fromJSON(
      {
        'app.json': '{}',
        'App.js': 'console.log("hello")',
      },
      '/app'
    );
    asMock(hasRequiredIOSFilesAsync).mockResolvedValueOnce(true);
    expect((await getProjectStateAsync('/app')).customized).toBe(true);
  });

  it('should return devClientInstalled=true from project with resolvable expo-dev-client', async () => {
    vol.fromJSON(
      {
        'app.json': '{}',
        'App.js': 'console.log("hello")',
        'node_modules/expo-dev-client/package.json': '{}',
      },
      '/app'
    );
    expect((await getProjectStateAsync('/app')).devClientInstalled).toBe(true);
  });

  it('should all return false when running from outside of a project', async () => {
    asMock(getPackageJson).mockImplementationOnce(() => {
      throw new Error('no package.json');
    });
    expect(await getProjectStateAsync('/non-existed-path')).toEqual({
      customized: false,
      expoGoCompatible: false,
      devClientInstalled: false,
    });
  });
});

describe(isExpoGoCompatibleAsync, () => {
  it('should return true for project with no unbundled native modules', async () => {
    asMock(findUnbundledNativeModulesAsync).mockResolvedValueOnce([]);
    await expect(isExpoGoCompatibleAsync('/app')).resolves.toBe(true);
  });

  it('should return false for project with no unbundled native modules', async () => {
    asMock(findUnbundledNativeModulesAsync).mockResolvedValueOnce(['react-native-flipper']);
    await expect(isExpoGoCompatibleAsync('/app')).resolves.toBe(false);
  });
});
