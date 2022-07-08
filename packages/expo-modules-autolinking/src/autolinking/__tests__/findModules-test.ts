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

// mock findUp.sync to fix `mergeLinkingOptions` package.json resolution when requiring `findModules`.
(findUp.sync as jest.MockedFunction<any>).mockReturnValueOnce(path.join(expoRoot, 'package.json'));
const mockProjectPackageJsonPath = jest.fn();
jest.mock('../mergeLinkingOptions', () => {
  const actualModule = jest.requireActual('../mergeLinkingOptions');
  return {
    ...actualModule,
    get projectPackageJsonPath() {
      return mockProjectPackageJsonPath();
    },
  };
});

const {
  findModulesAsync,
}: { findModulesAsync: typeof findModulesAsyncType } = require('../findModules');

describe(findModulesAsync, () => {
  let globMockedPathMap: Record<string, string[]>;

  beforeEach(() => {
    globMockedPathMap = {};
    (fs.realpath as jest.MockedFunction<any>).mockImplementation((path) => Promise.resolve(path));
  });

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  function addMockedModule(
    name: string,
    options: {
      globCwd: string;
      nodeModulesRoot?: string;
      pkgVersion?: string;
      pkgDependencies?: Record<string, string>;
    }
  ) {
    const nodeModulesRoot = options.nodeModulesRoot ?? path.join(expoRoot, 'node_modules');
    const pkgDir = path.join(nodeModulesRoot, name);

    // mock require() call to module's package.json
    registerRequireMock(path.join(pkgDir, 'package.json'), {
      name,
      version: options.pkgVersion ?? '0.0.1',
      dependencies: options.pkgDependencies ?? {},
    });

    // mock glob call to return expo-module.config.json
    if (!globMockedPathMap[options.globCwd]) {
      globMockedPathMap[options.globCwd] = [];
    }
    globMockedPathMap[options.globCwd].push(`${name}/expo-module.config.json`);
    registerGlobMock(glob, globMockedPathMap[options.globCwd], options.globCwd);

    // mock require() call to module's expo-module.config.json
    registerRequireMock(path.join(pkgDir, 'expo-module.config.json'), {
      platforms: ['ios'],
    });
  }

  /**
   * /app
   *   └── /app/node_modules/react-native-third-party
   */
  it('should link top level package', async () => {
    const searchPath = path.join(expoRoot, 'node_modules');
    addMockedModule('react-native-third-party', { globCwd: searchPath });

    const result = await findModulesAsync({
      searchPaths: [searchPath],
      platform: 'ios',
    });
    expect(result['react-native-third-party']).not.toBeUndefined();
  });

  /**
   * /app
   *   ├── /app/node_modules/react-native-third-party
   *   └── /app/node_modules/@expo/expo-test
   */
  it('should link scoped level package', async () => {
    const searchPath = path.join(expoRoot, 'node_modules');
    const mockedModules = ['react-native-third-party', '@expo/expo-test'];
    for (const mockedModule of mockedModules) {
      addMockedModule(mockedModule, { globCwd: searchPath });
    }

    const result = await findModulesAsync({
      searchPaths: [searchPath],
      platform: 'ios',
    });
    expect(Object.keys(result).length).toBe(2);
  });

  /**
   * /workspace
   *   │ ╚══ /workspace/packages/app
   *   │
   *   └── /workspace/node_modules/pkg
   */
  [
    'should link hoisted package in workspace',
    'should not link hoisted package which are not in app project dependencies',
  ].forEach((testCaseName) => {
    it(testCaseName, async () => {
      const isNegativeTest = testCaseName.search('not');
      const appPackageJsonPath = path.join(expoRoot, 'packages', 'app', 'package.json');
      const appNodeModules = path.join(expoRoot, 'packages', 'app', 'node_modules');

      // mock app project package.json
      const appDependencies = isNegativeTest ? {} : { pkg: '*' };
      mockProjectPackageJsonPath.mockReturnValue(appPackageJsonPath);
      registerRequireMock(appPackageJsonPath, {
        name: 'app',
        version: '0.0.1',
        dependencies: appDependencies,
      });

      // add mocked pkg
      const workspaceNodeModules = path.join(expoRoot, 'node_modules');
      const searchPaths = [appNodeModules, workspaceNodeModules];
      addMockedModule('pkg', {
        globCwd: workspaceNodeModules,
        nodeModulesRoot: workspaceNodeModules,
      });

      const result = await findModulesAsync({
        searchPaths,
        platform: 'ios',
      });
      if (isNegativeTest) {
        expect(result['pkg']).toBeUndefined();
      } else {
        expect(result['pkg']).not.toBeUndefined();
      }
    });
  });

  /**
   * /workspace
   *   │ ╚══ /workspace/packages/app
   *   │
   *   ├── /workspace/node_modules/dep-pkg
   *   └── /workspace/node_modules/pkg
   */
  [
    'should link packages which are in app project transitive dependencies',
    'should not link packages which are not in app project transitive dependencies',
  ].forEach((testCaseName) => {
    it(testCaseName, async () => {
      const isNegativeTest = testCaseName.search('not');
      const appPackageJsonPath = path.join(expoRoot, 'packages', 'app', 'package.json');
      const appNodeModules = path.join(expoRoot, 'packages', 'app', 'node_modules');

      // mock app project package.json

      const appDependencies = isNegativeTest ? {} : { 'dpk-pkg': '*' };
      mockProjectPackageJsonPath.mockReturnValue(appPackageJsonPath);
      registerRequireMock(appPackageJsonPath, {
        name: 'app',
        version: '0.0.1',
        dependencies: appDependencies,
      });

      // add mocked pkgs
      const workspaceNodeModules = path.join(expoRoot, 'node_modules');
      const searchPaths = [appNodeModules, workspaceNodeModules];
      addMockedModule('pkg', {
        globCwd: workspaceNodeModules,
        nodeModulesRoot: workspaceNodeModules,
        pkgVersion: '0.0.0',
      });
      addMockedModule('dep-pkg', {
        globCwd: workspaceNodeModules,
        nodeModulesRoot: workspaceNodeModules,
        pkgVersion: '0.0.1',
        pkgDependencies: {
          pkg: '*',
        },
      });

      const result = await findModulesAsync({
        searchPaths,
        platform: 'ios',
      });
      if (isNegativeTest) {
        expect(result['pkg']).toBeUndefined();
      } else {
        expect(result['pkg']).not.toBeUndefined();
      }
    });
  });

  /**
   * /workspace
   *   │ ╚══ /workspace/packages/app
   *   │       └── /workspace/packages/app/node_modules/pkg@1.0.0
   *   │
   *   └── /workspace/node_modules/pkg@0.0.0
   */
  it('should link non-hoisted package first if there are multiple versions', async () => {
    const appPackageJsonPath = path.join(expoRoot, 'packages', 'app', 'package.json');
    const appNodeModules = path.join(expoRoot, 'packages', 'app', 'node_modules');

    // mock app project package.json
    mockProjectPackageJsonPath.mockReturnValue(appPackageJsonPath);
    registerRequireMock(appPackageJsonPath, {
      name: 'app',
      version: '0.0.1',
      dependencies: {
        pkg: '1.0.0',
      },
    });

    // add mocked pkgs
    const workspaceNodeModules = path.join(expoRoot, 'node_modules');
    const searchPaths = [appNodeModules, workspaceNodeModules];
    addMockedModule('pkg', {
      globCwd: workspaceNodeModules,
      nodeModulesRoot: workspaceNodeModules,
      pkgVersion: '0.0.0',
    });
    addMockedModule('pkg', {
      globCwd: appNodeModules,
      nodeModulesRoot: appNodeModules,
      pkgVersion: '1.0.0',
    });

    const result = await findModulesAsync({
      searchPaths,
      platform: 'ios',
    });
    expect(result['pkg']).not.toBeUndefined();
    expect(result['pkg'].version).toEqual('1.0.0');
  });
});
