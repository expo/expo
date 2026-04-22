import { error } from 'console';
import * as fs from 'fs';
import { vol } from 'memfs';

import {
  createSymlinksToKotlinFiles,
  generateInlineModulesListFile,
  getClassName,
} from '../inlineModules/androidInlineModules';
import type { InlineModulesMirror } from '../inlineModules/inlineModules';
import {
  getMirrorStateObject,
  getKotlinFileNameWithItsPackage,
  inlineModuleFileNameInformation,
} from '../inlineModules/inlineModules';

jest.mock('fs', () => require('memfs').fs);
jest.mock('fs/promises', () => require('memfs').fs.promises);
jest.mock('console', () => ({
  error: jest.fn(),
  warn: jest.fn(),
}));

const properKotlinModuleNameWithPackage = 'some.package.inlineModulesExamples.SimpleModule';
const properKotlinModule = `package some.package.inlineModulesExamples

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

public class SimpleModule : Module() {
  override fun definition() = ModuleDefinition {
    Constant("test") { ->
      "Kotlin constant 7610"
    }
  }
}
`;

const noPackageKotlinModule = `

public class SomeModule : Module() {
  override fun definition() = ModuleDef
`;

describe('inlineModules.ts', () => {
  let originalCwd: () => string;

  beforeAll(() => {
    originalCwd = process.cwd;
    process.cwd = () => '/example-project/app';
  });

  afterAll(() => {
    process.cwd = originalCwd;
  });

  beforeEach(() => {
    vol.reset();
  });

  describe('inlineModuleFileNameInformation', () => {
    it('accepts valid kotlin and swift files', () => {
      expect(inlineModuleFileNameInformation('SimpleModule.kt')).toEqual({
        valid: true,
        ext: '.kt',
      });
      expect(inlineModuleFileNameInformation('SimpleModule.swift')).toEqual({
        valid: true,
        ext: '.swift',
      });
    });

    it('rejects files with extra dots (e.g. .android.kt)', () => {
      expect(inlineModuleFileNameInformation('SomeModule.android.kt')).toEqual({
        valid: false,
        ext: '.kt',
      });
    });

    it('rejects unsupported extensions', () => {
      expect(inlineModuleFileNameInformation('SimpleModule.ts')).toEqual({
        valid: false,
        ext: '.ts',
      });
    });
  });

  describe('getKotlinFileNameWithItsPackage', () => {
    it('extracts the package name and appends the file name', async () => {
      vol.fromJSON({
        '/example-project/SimpleModule.kt': properKotlinModule,
      });

      const result = await getKotlinFileNameWithItsPackage('/example-project/SimpleModule.kt');
      expect(result).toBe(properKotlinModuleNameWithPackage);
    });

    it('returns null if the package regex fails', async () => {
      vol.fromJSON({
        '/example-project/NoPackageModule.kt': noPackageKotlinModule,
      });

      const result = await getKotlinFileNameWithItsPackage('/example-project/NoPackageModule.kt');
      expect(result).toBeNull();
    });

    it("returns null if the file doesn't exists", async () => {
      const result = await getKotlinFileNameWithItsPackage('/example-project/NonExistentModule.kt');
      expect(result).toBeNull();
    });
  });

  describe('getMirrorStateObject', () => {
    it('scans directories and correctly builds the mirror object', async () => {
      vol.fromJSON({
        '/example-project/package.json': '{}',
        '/example-project/app/ValidAndroid1.kt': 'package app.valid\nclass ValidAndroid1',
        '/example-project/app/modules/ValidApple1.swift': 'internal import ExpoModulesCore',
        '/example-project/app/Invalid.android.kt': 'package valid.package',
        '/example-project/src/nested/Invalid2.kt': 'class NoPackage',
        '/example-project/src/nested/Readme.md': '# Hello',
        '/example-project/src/nested/ValidApple2.swift': 'internal import ExpoModulesCore',
        '/example-project/other/ValidApple3.swift': 'internal import ExpoModulesCore',
        '/other-project/src/ValidAndroid2.kt': 'package app.valid\nclass ValidAndroid2',
      });

      const result = await getMirrorStateObject(
        ['app', 'src/nested/', '../other-project/src'],
        '/example-project'
      );

      expect(result.swiftModuleClassNames).toEqual(['ValidApple1', 'ValidApple2']);
      expect(result.kotlinClasses).toEqual(['app.valid.ValidAndroid1', 'app.valid.ValidAndroid2']);

      expect(result.files).toHaveLength(4);
      const sortingFunction = (o1, o2) => o2.filePath.length - o1.filePath.length;
      expect(result.files.sort(sortingFunction)).toEqual(
        [
          {
            filePath: '/example-project/app/ValidAndroid1.kt',
            watchedDir: '/example-project/app',
          },
          {
            filePath: '/other-project/src/ValidAndroid2.kt',
            watchedDir: '/other-project/src',
          },
          {
            filePath: '/example-project/app/modules/ValidApple1.swift',
            watchedDir: '/example-project/app',
          },
          {
            filePath: '/example-project/src/nested/ValidApple2.swift',
            watchedDir: '/example-project/src/nested',
          },
        ].sort(sortingFunction)
      );
    });
  });
});

describe('androidInlineModules.ts', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('getClassName', () => {
    it('extracts the class name from a standard package structure', () => {
      expect(getClassName('com.example.ExampleModule')).toBe('ExampleModule');
      expect(getClassName('expo.modules.ExampleView')).toBe('ExampleView');
    });

    it('extracts the class name from deeply nested packages', () => {
      expect(getClassName('org.my.company.ui.components.SimpleModule')).toBe('SimpleModule');
      expect(getClassName('a.b.c.d.e.TestView')).toBe('TestView');
    });
  });

  describe('createSymlinksToKotlinFiles', () => {
    it('catches and logs errors when the symlink cannot be created', async () => {
      const mockMirror: InlineModulesMirror = {
        files: [{ filePath: '/src/SimpleModule.kt', watchedDir: '/src' }],
        kotlinClasses: [],
        swiftModuleClassNames: [],
      };

      vol.fromJSON({
        '/src/SimpleModule.kt': 'package valid.files',
        '/build/mirror/SimpleModule.kt': 'package file.at.symlink.destination',
      });

      await createSymlinksToKotlinFiles('/build/mirror', mockMirror);

      expect(error).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't symlink inline module: /src/SimpleModule.kt")
      );

      expect(error).toHaveBeenCalledWith(expect.stringContaining('EEXIST'));
    });

    it('creates the mirror directory structure and symlinks original module files', async () => {
      const mockMirror: InlineModulesMirror = {
        files: [
          {
            filePath: '/example-project/app/ValidAndroid1.kt',
            watchedDir: '/example-project/app',
          },
          {
            filePath: '/other-project/src/nest/ValidAndroid2.kt',
            watchedDir: '/other-project/src',
          },
          {
            filePath: '/example-project/app/modules/ValidApple1.swift',
            watchedDir: '/example-project/app',
          },
          {
            filePath: '/example-project/src/nested/ValidApple2.swift',
            watchedDir: '/example-project/src/nested',
          },
        ],
        swiftModuleClassNames: [],
        kotlinClasses: [],
      };

      vol.fromJSON({
        '/example-project/package.json': '{}',
        '/example-project/app/ValidAndroid1.kt': 'package app.valid\nclass ValidAndroid1',
        '/example-project/app/modules/ValidApple1.swift': 'internal import ExpoModulesCore',
        '/example-project/app/Invalid.android.kt': 'package valid.package',
        '/example-project/src/nested/Invalid2.kt': 'class NoPackage',
        '/example-project/src/nested/Readme.md': '# Hello',
        '/example-project/src/nested/ValidApple2.swift': 'internal import ExpoModulesCore',
        '/example-project/other/ValidApple3.swift': 'internal import ExpoModulesCore',
        '/other-project/src/nest/ValidAndroid2.kt': 'package app.valid\nclass ValidAndroid2',
      });

      await createSymlinksToKotlinFiles('/build/mirror', mockMirror);

      // TODO @HubertBer this path was originally <absolute path to mirror>/<relative path from app root of the watched directory>
      // but now it is just <absolute path to mirror>/<path from the watched directory>.
      // Need to rethink and rewrite it as now it can merge watchedDirectories from multiple repos into one - not obvious if that's problematic or not as the files either way have to have different names.
      expect(vol.existsSync('/build/mirror/ValidAndroid1.kt')).toBe(true);
      expect(vol.existsSync('/build/mirror/nest/ValidAndroid2.kt')).toBe(true);
    });
  });

  describe('generateInlineModulesListFile', () => {
    it('generates the Java inline modules list file with the provided classes', async () => {
      const listPath = '/build/generated';
      const mockMirror: InlineModulesMirror = {
        files: [],
        swiftModuleClassNames: [],
        kotlinClasses: ['some.simple.package.SimpleModule', 'other.package.SimpleView'],
      };

      await generateInlineModulesListFile(listPath, mockMirror);

      const targetFile = '/build/generated/ExpoInlineModulesList.java';

      expect(fs.existsSync(targetFile)).toBe(true);

      const content = await fs.promises.readFile(targetFile, 'utf8');

      expect(content).toContain('some.simple.package.SimpleModule.class, "SimpleModule"');
      expect(content).toContain('other.package.SimpleView.class, "SimpleView"');
    });
  });
});
