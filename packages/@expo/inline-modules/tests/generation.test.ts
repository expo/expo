import { it, expect, describe } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

import {
  isValidInlineModuleFileName,
  trimExtension,
  getProjectExcludePathsGlobs,
  getMirrorDirectoriesPaths,
  isFilePathExcluded,
  findUpPackageJsonDirectoryCached,
  typesAndModulePathsForFile,
} from '../src/generation';

describe('extensions, names, paths', () => {
  it('valid inline module file name', () => {
    expect(isValidInlineModuleFileName('TestModule.kt')).toBe(true);
    expect(isValidInlineModuleFileName('TestModule.swift')).toBe(true);
    expect(isValidInlineModuleFileName('A.kt')).toBe(true);
    expect(isValidInlineModuleFileName('A.swift')).toBe(true);
    expect(isValidInlineModuleFileName('TestModule.k')).toBe(false);
    expect(isValidInlineModuleFileName('TestModule.js')).toBe(false);
    expect(isValidInlineModuleFileName('swift.')).toBe(false);
  });
  it('trim extension', () => {
    expect(trimExtension('TestModule.kt')).toBe('TestModule');
    expect(trimExtension('A.swift')).toBe('A');
    expect(trimExtension('module.js')).toBe('module');
    expect(trimExtension('module')).toBe('module');
    expect(trimExtension('module.test.ts')).toBe('module.test');
  });
  it('excluded files', () => {
    const projectRoot = '/Projects/project1';
    const excludePathsGlobs = getProjectExcludePathsGlobs(projectRoot);
    const isFileExcluded = (filePath: string) => isFilePathExcluded(filePath, excludePathsGlobs);
    expect(isFileExcluded('/Projects/project1/android/app/src/Module.kt')).toBe(true);
    expect(isFileExcluded('/Projects/project1/ios/app/Module.swift')).toBe(true);
    expect(isFileExcluded('/Projects/project1/.expo/Module.kt')).toBe(true);
    expect(isFileExcluded('/Projects/project1/node_modules/module/Module.kt')).toBe(true);
    expect(isFileExcluded('/Projects/project1/modules/module/Module.swift')).toBe(true);

    // While not supported yet, don't exclude the modules in project root.
    expect(isFileExcluded('/Projects/project1/Module.swift')).toBe(false);
    expect(isFileExcluded('/Projects/project1/app/Module.swift')).toBe(false);
    expect(isFileExcluded('/Projects/project1/src/something/Module.swift')).toBe(false);
    expect(isFileExcluded('/Projects/project1/weirdFolder/Module.swift')).toBe(false);
  });
  it('mirror directories paths', () => {
    const dotExpoDir = '/project/.expo';
    expect(getMirrorDirectoriesPaths(dotExpoDir)).toEqual({
      inlineModulesModulesPath: '/project/.expo/inlineModules/modules',
      inlineModulesTypesPath: '/project/.expo/inlineModules/types',
    });
  });
  it('types and modules mirror file paths', () => {
    const projectRoot = path.resolve(__dirname, './testProjectStructure');
    const dotExpoDir = path.resolve(projectRoot, '.expo');
    const watchedDirAncestor = path.resolve(projectRoot, 'app');
    const directoryToPackage = new Map<string, string>([
      [projectRoot, projectRoot],
      [watchedDirAncestor, projectRoot],
    ]);
    const filePath = path.resolve(projectRoot, 'app/SimpleModule.swift');

    expect(
      typesAndModulePathsForFile(dotExpoDir, watchedDirAncestor, filePath, directoryToPackage)
    ).toEqual({
      moduleTypesFilePath: path.resolve(
        dotExpoDir,
        'inlineModules/types/app/SimpleModule.module.d.ts'
      ),
      viewTypesFilePath: path.resolve(dotExpoDir, 'inlineModules/types/app/SimpleModule.view.d.ts'),
      viewExportPath: path.resolve(dotExpoDir, 'inlineModules/modules/app/SimpleModule.view.js'),
      moduleExportPath: path.resolve(
        dotExpoDir,
        'inlineModules/modules/app/SimpleModule.module.js'
      ),
      moduleName: 'SimpleModule',
    });
  });
});

const fsMocks = {
  existsSync: jest.fn(),

  promises: {
    mkdir: jest.fn(),
  },
};

jest.mock('fs', () => ({
  existsSync: jest.fn(),

  promises: {
    mkdir: jest.fn(),
  },
}));

describe('find up package json', () => {
  const testProjectDirectory = path.resolve(__dirname, './testProjectStructure');
  const nonexistentPath = path.resolve(testProjectDirectory, './this/path/does/not/exist');
  const pathToPackage = path.resolve(testProjectDirectory, './somePackage/folder/anotherFolder/');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('use the cache if possible, guarantee no necessary calls to fs happen.', async () => {
    expect(
      findUpPackageJsonDirectoryCached(
        nonexistentPath,
        new Map([[nonexistentPath, nonexistentPath]])
      )
    ).toEqual(nonexistentPath);

    expect(
      findUpPackageJsonDirectoryCached(nonexistentPath, new Map([[nonexistentPath, pathToPackage]]))
    ).toEqual(pathToPackage);

    // Ensure no calls to fs happened
    Object.values(fsMocks).forEach((mock) => {
      if (jest.isMockFunction(mock)) {
        expect(mock).not.toHaveBeenCalled();
      }
    });

    Object.values(fsMocks.promises).forEach((mock) => {
      if (jest.isMockFunction(mock)) {
        expect(mock).not.toHaveBeenCalled();
      }
    });
  });

  it('expect only two calls to existSync.', async () => {
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false).mockReturnValueOnce(true);

    const result = await findUpPackageJsonDirectoryCached(pathToPackage, new Map());

    expect(result).toEqual(path.dirname(pathToPackage));

    expect(fs.existsSync).toHaveBeenCalledWith(path.resolve(pathToPackage, 'package.json'));
    expect(fs.existsSync).toHaveBeenCalledWith(
      path.resolve(path.dirname(pathToPackage), 'package.json')
    );
    expect(fs.existsSync).toHaveBeenCalledTimes(2);
  });

  it('expect only one call to existSync and resolution from cache.', async () => {
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

    const result = await findUpPackageJsonDirectoryCached(
      pathToPackage,
      new Map([[path.dirname(pathToPackage), path.dirname(pathToPackage)]])
    );

    expect(result).toEqual(path.dirname(pathToPackage));

    expect(fs.existsSync).toHaveBeenCalledWith(path.resolve(pathToPackage, 'package.json'));
    expect(fs.existsSync).toHaveBeenCalledTimes(1);
  });
});
