/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const underTest = require('../generate-artifacts-executor');
const fixtures = require('../__test_fixtures__/fixtures');
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

const codegenConfigKey = 'codegenConfig';
const reactNativeDependencyName = 'react-native';
const rootPath = path.join(__dirname, '../../..');

describe('generateCode', () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it('executeNodes with the right arguments', () => {
    // Define variables and expected values
    const iosOutputDir = 'app/ios/build/generated/ios';
    const library = {config: {name: 'library', type: 'all'}};
    const tmpDir = 'tmp';
    const node = 'usr/bin/node';
    const pathToSchema = 'app/build/schema.json';
    const rnRoot = path.join(__dirname, '../..');
    const libraryType = 'all';

    const tmpOutDir = path.join(tmpDir, 'out');

    // mock used functions
    jest.spyOn(fs, 'mkdirSync').mockImplementation();
    jest.spyOn(child_process, 'execSync').mockImplementation();

    underTest._generateCode(iosOutputDir, library, tmpDir, node, pathToSchema);

    const expectedCommand = `${node} ${path.join(
      rnRoot,
      'generate-specs-cli.js',
    )}         --platform ios         --schemaPath ${pathToSchema}         --outputDir ${tmpOutDir}         --libraryName ${
      library.config.name
    }         --libraryType ${libraryType}`;

    expect(child_process.execSync).toHaveBeenCalledTimes(2);
    expect(child_process.execSync).toHaveBeenNthCalledWith(1, expectedCommand);
    expect(child_process.execSync).toHaveBeenNthCalledWith(
      2,
      `cp -R ${tmpOutDir}/* ${iosOutputDir}`,
    );

    expect(fs.mkdirSync).toHaveBeenCalledTimes(2);
    expect(fs.mkdirSync).toHaveBeenNthCalledWith(1, tmpOutDir, {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenNthCalledWith(2, iosOutputDir, {
      recursive: true,
    });
  });
});

describe('extractLibrariesFromJSON', () => {
  it('throws if in react-native and no dependencies found', () => {
    let libraries = [];
    let configFile = {};
    expect(() => {
      underTest._extractLibrariesFromJSON(
        configFile,
        libraries,
        codegenConfigKey,
      );
    }).toThrow();
  });

  it('it skips if not into react-native and no dependencies found', () => {
    let libraries = [];
    let configFile = {};

    underTest._extractLibrariesFromJSON(
      configFile,
      libraries,
      codegenConfigKey,
      'some-node-module',
      'node_modules/some',
    );
    expect(libraries.length).toBe(0);
  });

  it('extracts a single dependency when config has no libraries', () => {
    let libraries = [];
    let configFile = fixtures.noLibrariesConfigFile;
    underTest._extractLibrariesFromJSON(
      configFile,
      libraries,
      codegenConfigKey,
      'my-app',
      '.',
    );
    expect(libraries.length).toBe(1);
    expect(libraries[0]).toEqual({
      library: 'my-app',
      config: {
        name: 'AppModules',
        type: 'all',
        jsSrcsDir: '.',
      },
      libraryPath: '.',
    });
  });

  it("extract codegenConfig when it's empty", () => {
    const configFile = {codegenConfig: {libraries: []}};
    let libraries = [];
    underTest._extractLibrariesFromJSON(
      configFile,
      codegenConfigKey,
      libraries,
      reactNativeDependencyName,
      rootPath,
    );
    expect(libraries.length).toBe(0);
  });

  it('extract codegenConfig when dependency is one', () => {
    const configFile = fixtures.singleLibraryCodegenConfig;
    let libraries = [];
    underTest._extractLibrariesFromJSON(
      configFile,
      libraries,
      codegenConfigKey,
      reactNativeDependencyName,
      rootPath,
    );
    expect(libraries.length).toBe(1);
    expect(libraries[0]).toEqual({
      library: reactNativeDependencyName,
      config: {
        name: 'react-native',
        type: 'all',
        jsSrcsDir: '.',
      },
      libraryPath: rootPath,
    });
  });

  it('extract codegenConfig with multiple dependencies', () => {
    const configFile = fixtures.multipleLibrariesCodegenConfig;
    const myDependency = 'my-dependency';
    const myDependencyPath = path.join(__dirname, myDependency);
    let libraries = [];
    underTest._extractLibrariesFromJSON(
      configFile,
      libraries,
      codegenConfigKey,
      myDependency,
      myDependencyPath,
    );
    expect(libraries.length).toBe(3);
    expect(libraries[0]).toEqual({
      library: myDependency,
      config: {
        name: 'react-native',
        type: 'all',
        jsSrcsDir: '.',
      },
      libraryPath: myDependencyPath,
    });
    expect(libraries[1]).toEqual({
      library: myDependency,
      config: {
        name: 'my-component',
        type: 'components',
        jsSrcsDir: 'component/js',
      },
      libraryPath: myDependencyPath,
    });
    expect(libraries[2]).toEqual({
      library: myDependency,
      config: {
        name: 'my-module',
        type: 'module',
        jsSrcsDir: 'module/js',
      },
      libraryPath: myDependencyPath,
    });
  });
});

describe('findCodegenEnabledLibraries', () => {
  const mock = require('mock-fs');
  const {
    _findCodegenEnabledLibraries: findCodegenEnabledLibraries,
  } = require('../generate-artifacts-executor');

  afterEach(() => {
    mock.restore();
  });

  it('returns libraries defined in react-native.config.js', () => {
    const projectDir = path.join(__dirname, '../../../../test-project');
    const baseCodegenConfigFileDir = path.join(__dirname, '../../..');
    const baseCodegenConfigFilePath = path.join(
      baseCodegenConfigFileDir,
      'package.json',
    );

    mock({
      [baseCodegenConfigFilePath]: `
      {
        "codegenConfig": {}
      }
      `,
      [projectDir]: {
        app: {
          'package.json': `{
            "name": "my-app"
          }`,
          'react-native.config.js': '',
        },
        'library-foo': {
          'package.json': `{
            "name": "react-native-foo",
            "codegenConfig": {
              "name": "RNFooSpec",
              "type": "modules",
              "jsSrcsDir": "src"
            }
          }`,
        },
      },
    });

    jest.mock(path.join(projectDir, 'app', 'react-native.config.js'), () => ({
      dependencies: {
        'react-native-foo': {
          root: path.join(projectDir, 'library-foo'),
        },
        'react-native-bar': {
          root: path.join(projectDir, 'library-bar'),
        },
      },
    }));

    const libraries = findCodegenEnabledLibraries(
      `${projectDir}/app`,
      baseCodegenConfigFileDir,
      `package.json`,
      'codegenConfig',
    );

    expect(libraries).toEqual([
      {
        library: 'react-native',
        config: {},
        libraryPath: baseCodegenConfigFileDir,
      },
      {
        library: 'react-native-foo',
        config: {name: 'RNFooSpec', type: 'modules', jsSrcsDir: 'src'},
        libraryPath: path.join(projectDir, 'library-foo'),
      },
    ]);
  });
});

describe('delete empty files and folders', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('when path is empty file, deletes it', () => {
    const targetFilepath = 'my-file.txt';
    let statSyncInvocationCount = 0;
    let rmSyncInvocationCount = 0;
    let rmdirSyncInvocationCount = 0;
    jest.mock('fs', () => ({
      statSync: filepath => {
        statSyncInvocationCount += 1;
        expect(filepath).toBe(targetFilepath);
        return {
          isFile: () => {
            return true;
          },
          size: 0,
        };
      },
      rmSync: filepath => {
        rmSyncInvocationCount += 1;
        expect(filepath).toBe(targetFilepath);
      },
      rmdirSync: filepath => {
        rmdirSyncInvocationCount += 1;
      },
    }));

    underTest._cleanupEmptyFilesAndFolders(targetFilepath);
    expect(statSyncInvocationCount).toBe(1);
    expect(rmSyncInvocationCount).toBe(1);
    expect(rmdirSyncInvocationCount).toBe(0);
  });

  it('when path is not an empty file, does nothing', () => {
    const targetFilepath = 'my-file.txt';
    const size = 128;

    let statSyncInvocationCount = 0;
    let rmSyncInvocationCount = 0;
    let rmdirSyncInvocationCount = 0;

    jest.mock('fs', () => ({
      statSync: filepath => {
        statSyncInvocationCount += 1;
        expect(filepath).toBe(targetFilepath);
        return {
          isFile: () => {
            return true;
          },
          size: size,
        };
      },
      rmSync: filepath => {
        rmSyncInvocationCount += 1;
      },
      rmdirSync: filepath => {
        rmdirSyncInvocationCount += 1;
      },
    }));

    underTest._cleanupEmptyFilesAndFolders(targetFilepath);
    expect(statSyncInvocationCount).toBe(1);
    expect(rmSyncInvocationCount).toBe(0);
    expect(rmdirSyncInvocationCount).toBe(0);
  });

  it("when path is folder and it's empty, removes it", () => {
    const targetFolder = 'build';
    const content = [];

    let statSyncInvocationCount = 0;
    let readdirInvocationCount = 0;
    let rmSyncInvocationCount = 0;
    let rmdirSyncInvocationCount = 0;

    jest.mock('fs', () => ({
      statSync: filepath => {
        statSyncInvocationCount += 1;
        expect(filepath).toBe(targetFolder);
        return {
          isFile: () => {
            return false;
          },
        };
      },
      rmSync: filepath => {
        rmSyncInvocationCount += 1;
      },
      rmdirSync: filepath => {
        rmdirSyncInvocationCount += 1;
        expect(filepath).toBe(targetFolder);
      },
      readdirSync: filepath => {
        readdirInvocationCount += 1;
        return content;
      },
    }));

    underTest._cleanupEmptyFilesAndFolders(targetFolder);
    expect(statSyncInvocationCount).toBe(1);
    expect(readdirInvocationCount).toBe(2);
    expect(rmSyncInvocationCount).toBe(0);
    expect(rmdirSyncInvocationCount).toBe(1);
  });

  it("when path is folder and it's not empty, removes only empty folders and files", () => {
    const targetFolder = 'build';
    const content = ['emptyFolder', 'emptyFile', 'notEmptyFile'];

    const files = [
      path.normalize('build/emptyFile'),
      path.normalize('build/notEmptyFile'),
    ];

    const emptyContent = [];
    let fileSizes = {};
    fileSizes[path.normalize('build/emptyFile')] = 0;
    fileSizes[path.normalize('build/notEmptyFile')] = 32;

    let statSyncInvocation = [];
    let rmSyncInvocation = [];
    let rmdirSyncInvocation = [];
    let readdirInvocation = [];

    jest.mock('fs', () => ({
      statSync: filepath => {
        statSyncInvocation.push(filepath);

        return {
          isFile: () => {
            return files.includes(filepath);
          },
          size: fileSizes[filepath],
        };
      },
      rmSync: filepath => {
        rmSyncInvocation.push(filepath);
      },
      rmdirSync: filepath => {
        rmdirSyncInvocation.push(filepath);
      },
      readdirSync: filepath => {
        readdirInvocation.push(filepath);
        return filepath === targetFolder ? content : emptyContent;
      },
    }));

    underTest._cleanupEmptyFilesAndFolders(targetFolder);
    expect(statSyncInvocation).toEqual([
      path.normalize('build'),
      path.normalize('build/emptyFolder'),
      path.normalize('build/emptyFile'),
      path.normalize('build/notEmptyFile'),
    ]);
    expect(readdirInvocation).toEqual([
      path.normalize('build'),
      path.normalize('build/emptyFolder'),
      path.normalize('build/emptyFolder'),
      path.normalize('build'),
    ]);
    expect(rmSyncInvocation).toEqual([path.normalize('build/emptyFile')]);
    expect(rmdirSyncInvocation).toEqual([path.normalize('build/emptyFolder')]);
  });

  it('when path is folder and it contains only empty folders, removes everything', () => {
    const targetFolder = 'build';
    const content = ['emptyFolder1', 'emptyFolder2'];
    const emptyContent = [];

    let statSyncInvocation = [];
    let rmSyncInvocation = [];
    let rmdirSyncInvocation = [];
    let readdirInvocation = [];

    jest.mock('fs', () => ({
      statSync: filepath => {
        statSyncInvocation.push(filepath);

        return {
          isFile: () => {
            return false;
          },
        };
      },
      rmSync: filepath => {
        rmSyncInvocation.push(filepath);
      },
      rmdirSync: filepath => {
        rmdirSyncInvocation.push(filepath);
      },
      readdirSync: filepath => {
        readdirInvocation.push(filepath);
        return filepath === targetFolder
          ? content.filter(
              element =>
                !rmdirSyncInvocation.includes(path.join(targetFolder, element)),
            )
          : emptyContent;
      },
    }));

    underTest._cleanupEmptyFilesAndFolders(targetFolder);
    expect(statSyncInvocation).toEqual([
      path.normalize('build'),
      path.normalize('build/emptyFolder1'),
      path.normalize('build/emptyFolder2'),
    ]);
    expect(readdirInvocation).toEqual([
      path.normalize('build'),
      path.normalize('build/emptyFolder1'),
      path.normalize('build/emptyFolder1'),
      path.normalize('build/emptyFolder2'),
      path.normalize('build/emptyFolder2'),
      path.normalize('build'),
    ]);
    expect(rmSyncInvocation).toEqual([]);
    expect(rmdirSyncInvocation).toEqual([
      path.normalize('build/emptyFolder1'),
      path.normalize('build/emptyFolder2'),
      path.normalize('build'),
    ]);
  });
});
