import glob from 'fast-glob';
import findUp from 'find-up';
import fs from 'fs-extra';
import path from 'path';

import { registerGlobMock, registerRequireMock } from '../../__tests__/mockHelpers';
import type { findModulesAsync as findModulesAsyncType } from '../findModules';

const expoRoot = path.join(__dirname, '..', '..', '..', '..', '..');

jest.mock('fast-glob');
jest.mock('find-up');
jest.mock('fs-extra');

// mock findUp.sync once to fix `mergeLinkingOptions` current package.json resolution when requiring `findModules`.
(findUp.sync as jest.MockedFunction<any>).mockReturnValueOnce(path.join(expoRoot, 'package.json'));
const {
  findModulesAsync,
}: { findModulesAsync: typeof findModulesAsyncType } = require('../findModules');

describe(findModulesAsync, () => {
  beforeEach(() => {
    (fs.realpath as jest.MockedFunction<any>).mockImplementation((path) => Promise.resolve(path));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function addMockedModule(name: string) {
    const pkgDir = path.join('node_modules', name);

    // mock require() call to module's package.json
    registerRequireMock(path.join(expoRoot, pkgDir, 'package.json'), {
      name,
      version: '0.0.1',
    });

    // mock require() call to module's expo-module.config.json
    registerRequireMock(path.join(expoRoot, pkgDir, 'expo-module.config.json'), {
      platforms: ['ios'],
    });
  }

  it('should link top level package', async () => {
    const searchPath = path.join(expoRoot, 'node_modules');
    addMockedModule('react-native-third-party');

    registerGlobMock(glob, ['react-native-third-party/expo-module.config.json'], searchPath);

    const result = await findModulesAsync({
      searchPaths: [searchPath],
      platform: 'ios',
    });
    expect(result['react-native-third-party']).not.toBeNull();
  });

  it('should link scoped level package', async () => {
    const searchPath = path.join(expoRoot, 'node_modules');
    const mockedModules = ['react-native-third-party', '@expo/expo-test'];
    for (const mockedModule of mockedModules) {
      addMockedModule(mockedModule);
    }

    registerGlobMock(
      glob,
      mockedModules.map((module) => `${module}/expo-module.config.json`),
      searchPath
    );

    const result = await findModulesAsync({
      searchPaths: [searchPath],
      platform: 'ios',
    });
    expect(Object.keys(result).length).toBe(2);
  });

  it('should link adapter package inside expo/ directory', async () => {
    const searchPath = path.join(expoRoot, 'node_modules');
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);

    // mock require() call to module's package.json
    registerRequireMock(path.join(expoRoot, pkgDir, 'package.json'), {
      name,
      version: '0.0.1',
    });

    // mock require() call to module's expo-module.config.json
    registerRequireMock(path.join(expoRoot, pkgDir, 'expo', 'expo-module.config.json'), {
      platforms: ['ios'],
    });

    registerGlobMock(glob, [`${name}/expo/expo-module.config.json`], searchPath);

    const result = await findModulesAsync({
      searchPaths: [searchPath],
      platform: 'ios',
    });
    expect(result[name]).not.toBeNull();
    expect(result[name].isExpoAdapter).toBe(true);
  });
});
