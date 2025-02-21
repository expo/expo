import glob from 'fast-glob';
import fs from 'fs';
import path from 'path';

import {
  registerGlobMock,
  registerMultiGlobMock,
  registerRequireMock,
} from '../../__tests__/mockHelpers';
import type { findModulesAsync as findModulesAsyncType } from '../findModules';

const expoRoot = path.join(__dirname, '..', '..', '..', '..', '..');

jest.mock('fast-glob');

const mockProjectPackageJsonPath = jest.fn().mockResolvedValue(path.join(expoRoot, 'package.json'));

jest.mock('../mergeLinkingOptions', () => {
  const actualModule = jest.requireActual('../mergeLinkingOptions');
  return {
    ...actualModule,
    getProjectPackageJsonPathAsync: mockProjectPackageJsonPath,
  };
});

const mockFsRealpath = jest.spyOn(fs.promises, 'realpath');

const {
  findModulesAsync,
}: { findModulesAsync: typeof findModulesAsyncType } = require('../findModules');

afterEach(() => {
  jest.resetAllMocks();
});

describe(findModulesAsync, () => {
  let globMockedPathMap: Record<string, string[]>;

  beforeEach(() => {
    globMockedPathMap = {};
    mockFsRealpath.mockImplementation((path) => Promise.resolve(`${path}`));
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
      projectRoot: expoRoot,
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
      projectRoot: expoRoot,
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
      mockProjectPackageJsonPath.mockResolvedValue(appPackageJsonPath);
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
        projectRoot: expoRoot,
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
      mockProjectPackageJsonPath.mockResolvedValue(appPackageJsonPath);
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
        projectRoot: expoRoot,
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
    mockProjectPackageJsonPath.mockResolvedValue(appPackageJsonPath);
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
      projectRoot: expoRoot,
    });
    expect(result['pkg']).not.toBeUndefined();
    expect(result['pkg'].version).toEqual('1.0.0');
  });

  /**
   * /app/node_modules
   *   ├── /expo → /.pnpm/expo@x.x.x+.../node_modules/expo
   *   ├── /expo-dev-client → /.pnpm/expo-dev-client@x.x.x+.../node_modules/expo-dev-client
   *   └── /.pnpm
   *         ├── /expo@x.x.x+.../node_modules
   *         │    ├── /@expo/cli
   *         │    ├── /expo
   *         │    └── /expo-application
   *         └── /expo-dev-client@x.x.x+.../node_modules
   *              ├── /expo-dev-client
   *              └── /expo-dev-launcher
   */
  it('should link pacakges which are installed in isolated stores', async () => {
    const modulesRoot = path.join(expoRoot, 'isolation', 'node_modules');

    // Create the isolated store paths
    const expoModulesDir = path.join(modulesRoot, '.pnpm', `expo@1.0.0`, 'node_modules');
    const devModulesDir = path.join(modulesRoot, '.pnpm', `expo-dev-client@1.0.0`, 'node_modules');

    // Keep track of all glob paths that need to return `<pkg>/expo-module.config.json`
    const globPaths: Record<string, string[]> = {
      [modulesRoot]: [],
      [expoModulesDir]: [],
      [devModulesDir]: [],
    };

    // Generate isolated `expo` package and its (nested) dependencies
    for (const pkgName of ['expo', '@expo/cli', 'expo-application']) {
      globPaths[expoModulesDir].push(`${pkgName}/expo-module.config.json`);
      addMockedModule(pkgName, {
        globCwd: expoModulesDir,
        nodeModulesRoot: expoModulesDir,
        pkgVersion: '1.0.0',
      });
    }

    // Generate isolated `expo-dev-client` package and its (nested) dependencies
    for (const pkgName of ['expo-dev-client', 'expo-dev-launcher']) {
      globPaths[devModulesDir].push(`${pkgName}/expo-module.config.json`);
      addMockedModule(pkgName, {
        globCwd: devModulesDir,
        nodeModulesRoot: devModulesDir,
        pkgVersion: '1.0.0',
      });
    }

    // Generate the project root `node_modules` dependencies
    for (const pkgName of ['expo', 'expo-dev-client']) {
      globPaths[modulesRoot].push(`${pkgName}/expo-module.config.json`);
      addMockedModule(pkgName, {
        globCwd: modulesRoot,
        nodeModulesRoot: modulesRoot,
        pkgVersion: '1.0.0',
      });
    }

    // Create a single glob mock that handles all separate isolated stores
    registerMultiGlobMock(glob, globPaths);

    // Mock `fs.realpath` to "fake" `expo` and `expo-dev-client` being linked from the isolated store
    mockFsRealpath.mockImplementation(async (filePath) => {
      const linkedModules = {
        [path.join(modulesRoot, 'expo')]: path.join(expoModulesDir, 'expo'),
        [path.join(modulesRoot, 'expo-dev-client')]: path.join(devModulesDir, 'expo-dev-client'),
      };

      // Either return the linked path, or the original path
      return linkedModules[filePath.toString()]
        ? linkedModules[filePath.toString()]
        : filePath.toString();
    });

    const result = await findModulesAsync({
      searchPaths: [modulesRoot],
      platform: 'ios',
      projectRoot: expoRoot,
    });

    // Validate `expo` and nested dependencies are linked
    expect(result.expo).not.toBeUndefined();
    expect(result['@expo/cli']).not.toBeUndefined();
    expect(result['expo-application']).not.toBeUndefined();

    // Validate `expo-dev-client` and nested dependencies are linked
    expect(result['expo-dev-client']).not.toBeUndefined();
    expect(result['expo-dev-launcher']).not.toBeUndefined();
  });

  /**
   * /app/node_modules
   *   ├── /expo → /.pnpm/expo@x.x.x+.../node_modules/expo
   *   ├── /expo-application → /.pnpm/expo-application@0.9.9+.../node_modules/expo-application
   *   └── /.pnpm
   *         ├── /expo@x.x.x+.../node_modules
   *         │    ├── /expo
   *         │    └── /expo-application (v1.0.0)
   *         └── /expo-application@0.9.9+.../node_modules
   *              └── /expo-application (v0.9.9)
   */
  it('should prefer project dependencies over nested isolated dependencies', async () => {
    const modulesRoot = path.join(expoRoot, 'isolation', 'node_modules');

    // Create the isolated store paths
    const expoModulesDir = path.join(modulesRoot, '.pnpm', `expo@1.0.0`, 'node_modules');
    const appModulesDir = path.join(modulesRoot, '.pnpm', `expo-application@0.9.9`, 'node_modules');

    // Keep track of all glob paths that need to return `<pkg>/expo-module.config.json`
    const globPaths: Record<string, string[]> = {
      [modulesRoot]: [],
      [expoModulesDir]: [],
      [appModulesDir]: [],
    };

    // Generate isolated `expo` package and its (nested) dependencies
    for (const pkgName of ['expo', 'expo-application']) {
      globPaths[expoModulesDir].push(`${pkgName}/expo-module.config.json`);

      addMockedModule(pkgName, {
        globCwd: expoModulesDir,
        nodeModulesRoot: expoModulesDir,
        pkgVersion: '1.0.0',
      });
    }

    // Generate isolated `expo-application` package
    globPaths[appModulesDir].push('expo-application/expo-module.config.json');
    addMockedModule('expo-application', {
      globCwd: appModulesDir,
      nodeModulesRoot: appModulesDir,
      pkgVersion: '0.9.9',
    });

    // Generate the project root `node_modules` dependencies
    globPaths[modulesRoot].push('expo/expo-module.config.json');
    addMockedModule('expo', {
      globCwd: modulesRoot,
      nodeModulesRoot: modulesRoot,
      pkgVersion: '1.0.0',
    });
    globPaths[modulesRoot].push('expo-application/expo-module.config.json');
    addMockedModule('expo-application', {
      globCwd: modulesRoot,
      nodeModulesRoot: modulesRoot,
      pkgVersion: '0.9.9', // This is a conflicting `expo-application` version, which should take presedence
    });

    // Create a single glob mock that handles all separate isolated stores
    registerMultiGlobMock(glob, globPaths);

    // Mock `fs.realpath` to "fake" `expo` and `expo-application` being linked from the isolated store
    mockFsRealpath.mockImplementation(async (filePath) => {
      const linkedModules = {
        [path.join(modulesRoot, 'expo')]: path.join(expoModulesDir, 'expo'),
        [path.join(modulesRoot, 'expo-application')]: path.join(appModulesDir, 'expo-application'),
      };

      // Either return the linked path, or the original path
      return linkedModules[filePath.toString()]
        ? linkedModules[filePath.toString()]
        : filePath.toString();
    });

    const result = await findModulesAsync({
      searchPaths: [modulesRoot],
      platform: 'ios',
      projectRoot: expoRoot,
    });

    // Validate both `expo` and `expo-application` are linked
    expect(result.expo).not.toBeUndefined();
    expect(result['expo-application']).not.toBeUndefined();

    // Validate that the project version is linked, but nested is detected as duplicate
    expect(result['expo-application'].version).toEqual('0.9.9');
    expect(result['expo-application'].duplicates).toEqual([
      expect.objectContaining({
        version: '1.0.0',
        path: path.join(expoModulesDir, 'expo-application'),
      }),
    ]);
  });
});
