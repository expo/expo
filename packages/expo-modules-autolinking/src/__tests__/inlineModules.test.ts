import { error, warn } from 'console';
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
  getKotlinInlineModuleInfo,
  hasSwiftModuleDefinition,
  inlineModuleFileNameInformation,
} from '../inlineModules/inlineModules';
import { isTargetInInlineModulesTargets } from '../inlineModules/iosInlineModules';

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

const noPackageKotlinModule = `public class SomeModule : Module() {
  override fun definition() = ModuleDefinition { Name("SomeModule") }
}
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

    it('accepts files with extra dots because module registration is content-based', () => {
      expect(inlineModuleFileNameInformation('SomeModule.android.kt')).toEqual({
        valid: true,
        ext: '.kt',
      });
      expect(inlineModuleFileNameInformation('Nested.compile.extra.swift')).toEqual({
        valid: true,
        ext: '.swift',
      });
      expect(inlineModuleFileNameInformation('Helpers.compile.kt')).toEqual({
        valid: true,
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

  describe('hasSwiftModuleDefinition', () => {
    it('detects an inline module returning ModuleDefinition', async () => {
      vol.fromJSON({
        '/example-project/AppIntentsSetup.swift':
          'import ExpoModulesCore\nfinal class AppIntentsSetup: Module {\n  func definition() -> ModuleDefinition { Name("AppIntentsSetup") }\n}',
      });

      await expect(
        hasSwiftModuleDefinition('/example-project/AppIntentsSetup.swift')
      ).resolves.toBe(true);
    });

    it('detects an inline module returning ExpoModulesCore.ModuleDefinition', async () => {
      vol.fromJSON({
        '/example-project/AppIntentsSetup.swift':
          'import ExpoModulesCore\nfinal class AppIntentsSetup: Module {\n  func definition() -> ExpoModulesCore.ModuleDefinition { Name("AppIntentsSetup") }\n}',
      });

      await expect(
        hasSwiftModuleDefinition('/example-project/AppIntentsSetup.swift')
      ).resolves.toBe(true);
    });

    it('does not treat supporting swift files as modules', async () => {
      vol.fromJSON({
        '/example-project/TrailEntity.compile.swift': 'import AppIntents\nstruct TrailEntity {}',
      });

      await expect(
        hasSwiftModuleDefinition('/example-project/TrailEntity.compile.swift')
      ).resolves.toBe(false);
    });
  });

  describe('getKotlinInlineModuleInfo', () => {
    it('detects a module definition and resolves its package-qualified class name', async () => {
      vol.fromJSON({
        '/example-project/SimpleModule.kt': properKotlinModule,
      });

      const result = await getKotlinInlineModuleInfo('/example-project/SimpleModule.kt');
      expect(result).toEqual({
        hasModuleDefinition: true,
        classNameWithPackage: properKotlinModuleNameWithPackage,
      });
    });

    it('detects a fully-qualified ModuleDefinition', async () => {
      vol.fromJSON({
        '/example-project/SimpleModule.kt':
          'package some.pkg\nclass SimpleModule : Module() {\n  override fun definition() = expo.modules.kotlin.modules.ModuleDefinition { Name("SimpleModule") }\n}',
      });

      const result = await getKotlinInlineModuleInfo('/example-project/SimpleModule.kt');
      expect(result).toEqual({
        hasModuleDefinition: true,
        classNameWithPackage: 'some.pkg.SimpleModule',
      });
    });

    it('does not treat supporting kotlin files as modules', async () => {
      vol.fromJSON({
        '/example-project/Helper.compile.kt': 'package some.pkg\nclass Helper',
      });

      const result = await getKotlinInlineModuleInfo('/example-project/Helper.compile.kt');
      expect(result).toEqual({ hasModuleDefinition: false, classNameWithPackage: null });
    });

    it('reports the module but a null class name when the package regex fails', async () => {
      vol.fromJSON({
        '/example-project/NoPackageModule.kt': noPackageKotlinModule,
      });

      const result = await getKotlinInlineModuleInfo('/example-project/NoPackageModule.kt');
      expect(result).toEqual({ hasModuleDefinition: true, classNameWithPackage: null });
    });

    it("returns no module when the file doesn't exist", async () => {
      const result = await getKotlinInlineModuleInfo('/example-project/NonExistentModule.kt');
      expect(result).toEqual({ hasModuleDefinition: false, classNameWithPackage: null });
    });

    it('finds the package even when a long comment precedes the declaration', async () => {
      const longComment = `// ${'x'.repeat(2000)}\n`;
      vol.fromJSON({
        '/example-project/CommentedModule.kt': `${longComment}${properKotlinModule}`,
      });

      const result = await getKotlinInlineModuleInfo('/example-project/CommentedModule.kt');
      expect(result).toEqual({
        hasModuleDefinition: true,
        classNameWithPackage: 'some.package.inlineModulesExamples.CommentedModule',
      });
    });
  });

  describe('getMirrorStateObject', () => {
    it('scans directories and correctly builds the mirror object', async () => {
      vol.fromJSON({
        '/example-project/package.json': '{}',
        '/example-project/app/ValidAndroid1.kt':
          'package app.valid\nclass ValidAndroid1 : Module() {\n  override fun definition() = ModuleDefinition { Name("ValidAndroid1") }\n}',
        '/example-project/app/modules/ValidApple1.swift':
          'internal import ExpoModulesCore\nfunc definition() -> ModuleDefinition',
        '/example-project/app/Invalid.android.kt': 'package valid.package',
        '/example-project/src/nested/Invalid2.kt': 'class NoPackage',
        '/example-project/src/nested/Readme.md': '# Hello',
        '/example-project/src/nested/ValidApple2.swift':
          'internal import ExpoModulesCore\nfunc definition() -> ModuleDefinition',
        '/example-project/other/ValidApple3.swift':
          'internal import ExpoModulesCore\nfunc definition() -> ModuleDefinition',
        '/other-project/src/ValidAndroid2.kt':
          'package app.valid\nclass ValidAndroid2 : Module() {\n  override fun definition() = ModuleDefinition { Name("ValidAndroid2") }\n}',
      });

      const result = await getMirrorStateObject({
        watchedDirectories: ['app', 'src/nested/', '../other-project/src'],
        appRoot: '/example-project',
      });

      expect(result.swiftModuleClassNames).toEqual(['ValidApple1', 'ValidApple2']);
      expect(result.kotlinClasses).toEqual(['app.valid.ValidAndroid1', 'app.valid.ValidAndroid2']);

      expect(result.files).toHaveLength(6);
      const sortingFunction = (
        o1: { filePath: string; watchedDir: string },
        o2: { filePath: string; watchedDir: string }
      ) => o2.filePath.length - o1.filePath.length;
      expect(result.files.sort(sortingFunction)).toEqual(
        [
          {
            filePath: '/example-project/app/ValidAndroid1.kt',
            watchedDir: '/example-project/app',
          },
          {
            filePath: '/example-project/app/Invalid.android.kt',
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
          {
            filePath: '/example-project/src/nested/Invalid2.kt',
            watchedDir: '/example-project/src/nested',
          },
        ].sort(sortingFunction)
      );
    });

    it('includes native files without module definitions in files but not in class name lists', async () => {
      vol.fromJSON({
        '/example-project/package.json': '{}',
        '/example-project/intents/MyModule.swift':
          'internal import ExpoModulesCore\nfunc definition() -> ModuleDefinition',
        '/example-project/intents/AppShortcuts.compile.swift': 'import AppIntents',
        '/example-project/intents/Helper.compile.kt': 'package some.pkg',
      });

      const result = await getMirrorStateObject({
        watchedDirectories: ['intents'],
        appRoot: '/example-project',
      });

      expect(result.swiftModuleClassNames).toEqual(['MyModule']);
      expect(result.kotlinClasses).toEqual([]);
      expect(result.files.map((f) => f.filePath).sort()).toEqual([
        '/example-project/intents/AppShortcuts.compile.swift',
        '/example-project/intents/Helper.compile.kt',
        '/example-project/intents/MyModule.swift',
      ]);
    });
  });

  describe('module filenames with dots', () => {
    it('registers a kotlin module definition in a dotted filename', async () => {
      (warn as jest.Mock).mockClear();
      vol.fromJSON({
        '/example-project/package.json': '{}',
        '/example-project/modules/My.Module.kt':
          'package some.pkg\nclass MyModule : Module() {\n  override fun definition() = ModuleDefinition { Name("MyModule") }\n}',
      });

      const result = await getMirrorStateObject({
        watchedDirectories: ['modules'],
        appRoot: '/example-project',
      });

      expect(result.kotlinClasses).toEqual(['some.pkg.My.Module']);
      expect(result.files.map((file) => file.filePath)).toEqual([
        '/example-project/modules/My.Module.kt',
      ]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('registers a swift module definition in a dotted filename', async () => {
      (warn as jest.Mock).mockClear();
      vol.fromJSON({
        '/example-project/package.json': '{}',
        '/example-project/intents/My.Module.swift':
          'import ExpoModulesCore\nfunc definition() -> ModuleDefinition',
      });

      const result = await getMirrorStateObject({
        watchedDirectories: ['intents'],
        appRoot: '/example-project',
      });

      expect(result.swiftModuleClassNames).toEqual(['My.Module']);
      expect(result.files.map((file) => file.filePath)).toEqual([
        '/example-project/intents/My.Module.swift',
      ]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('does not warn for supporting swift files without module definitions', async () => {
      (warn as jest.Mock).mockClear();
      vol.fromJSON({
        '/example-project/package.json': '{}',
        '/example-project/intents/MyModule.swift':
          'internal import ExpoModulesCore\npublic final class MyModule: Module {}',
      });

      const result = await getMirrorStateObject({
        watchedDirectories: ['intents'],
        appRoot: '/example-project',
      });

      expect(result.swiftModuleClassNames).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
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

describe('isTargetInInlineModulesTargets', () => {
  describe('with an explicit targetName', () => {
    it('should return true if targetName matches the mainTarget', () => {
      const targetName = 'AppTarget';
      const targetPath =
        '/Users/user1/Projects/apps/ios/Pods/Target Support Files/Pods-AppTarget/ExpoModulesProvider.swift';
      const inlineModulesTargets = { mainTarget: 'AppTarget', targets: [] };

      const result = isTargetInInlineModulesTargets({
        targetName,
        targetPath,
        inlineModulesTargets,
      });
      expect(result).toBe(true);
    });

    it('should return true if mainTarget is not provided and targetName is in the targets array', () => {
      const targetName = 'ExpoWidgetsTarget';
      const targetPath =
        '/Users/user1/Projects/apps/ios/Pods/Target Support Files/Pods-ExpoWidgetsTarget/ExpoModulesProvider.swift';
      const inlineModulesTargets = { targets: ['SomeOtherTarget', 'ExpoWidgetsTarget'] };

      const result = isTargetInInlineModulesTargets({
        targetName,
        targetPath,
        inlineModulesTargets,
      });
      expect(result).toBe(true);
    });

    it('should use targetName even when the path contains an abstract target prefix', () => {
      // With an abstract target the provider lives under `Pods-<abstract>-<target>`,
      // so the path-derived name would be `MyAbstractTarget-ExpoWidgetsTarget` and fail
      // to match. The explicit target name resolves this.
      const targetName = 'ExpoWidgetsTarget';
      const targetPath =
        '/Users/user1/Projects/apps/ios/Pods/Target Support Files/Pods-MyAbstractTarget-ExpoWidgetsTarget/ExpoModulesProvider.swift';
      const inlineModulesTargets = { targets: ['ExpoWidgetsTarget'] };

      const result = isTargetInInlineModulesTargets({
        targetName,
        targetPath,
        inlineModulesTargets,
      });
      expect(result).toBe(true);
    });

    it('should return false if targetName is not in the targets array', () => {
      const targetName = 'ExpoWidgetsTarget';
      const targetPath =
        '/Users/user1/Projects/apps/ios/Pods/Target Support Files/Pods-ExpoWidgetsTarget/ExpoModulesProvider.swift';
      const inlineModulesTargets = { targets: ['expo56c', 'SomeOtherTarget'] };

      const result = isTargetInInlineModulesTargets({
        targetName,
        targetPath,
        inlineModulesTargets,
      });
      expect(result).toBe(false);
    });
  });
});
