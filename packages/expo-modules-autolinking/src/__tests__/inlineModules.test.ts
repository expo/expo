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
  getSwiftInlineModuleInfo,
  inlineModuleFileNameInformation,
} from '../inlineModules/inlineModules';
import { isTargetInInlineModulesTargets } from '../inlineModules/iosInlineModules';
import { stripSwiftCommentsAndStrings } from '../inlineModules/swiftSource';

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

  describe('getSwiftInlineModuleInfo', () => {
    it('reports a module declared with the @ExpoModule macro', async () => {
      vol.fromJSON({
        '/example-project/GreeterModule.swift':
          'import ExpoModulesCore\n@MainActor\n@ExpoModule\npublic final class GreeterModule: Module {}',
      });

      await expect(
        getSwiftInlineModuleInfo('/example-project/GreeterModule.swift')
      ).resolves.toEqual({ hasModuleDefinition: true, declaredWithMacro: true });
    });

    it('does not treat an @ExpoModule mention in a comment as the macro', async () => {
      vol.fromJSON({
        '/example-project/AppIntentsSetup.swift':
          'import ExpoModulesCore\n/// Not declared with `@ExpoModule` yet.\nfinal class AppIntentsSetup: Module {\n  func definition() -> ModuleDefinition { Name("AppIntentsSetup") }\n}',
      });

      await expect(
        getSwiftInlineModuleInfo('/example-project/AppIntentsSetup.swift')
      ).resolves.toEqual({ hasModuleDefinition: true, declaredWithMacro: false });
    });

    it('reports the macro after an attribute with parentheses in a string', async () => {
      vol.fromJSON({
        '/example-project/OldModule.swift':
          'import ExpoModulesCore\n@available(*, deprecated, message: "Use NewModule() instead") @ExpoModule\npublic final class OldModule: Module {}',
      });

      await expect(getSwiftInlineModuleInfo('/example-project/OldModule.swift')).resolves.toEqual({
        hasModuleDefinition: true,
        declaredWithMacro: true,
      });
    });

    it('reports the macro after a multiline attribute', async () => {
      vol.fromJSON({
        '/example-project/OldModule.swift':
          'import ExpoModulesCore\n@available(\n  *,\n  deprecated\n) @ExpoModule\npublic final class OldModule: Module {}',
      });

      await expect(getSwiftInlineModuleInfo('/example-project/OldModule.swift')).resolves.toEqual({
        hasModuleDefinition: true,
        declaredWithMacro: true,
      });
    });

    it('keeps a file that mentions @ExpoModule in a string or a comment as an inline module, but not as the macro', async () => {
      vol.fromJSON({
        '/example-project/Helpers.swift':
          'import Foundation\n/* Move to\n   @ExpoModule */\nlet hint = "Use @ExpoModule"\nlet raw = #"@ExpoModule \\"#\nlet text = """\n@ExpoModule\n"""\n',
      });

      await expect(getSwiftInlineModuleInfo('/example-project/Helpers.swift')).resolves.toEqual({
        hasModuleDefinition: true,
        declaredWithMacro: false,
      });
    });

    it('reports the macro after a regex literal with a quote', async () => {
      vol.fromJSON({
        '/example-project/QuoteModule.swift':
          'import ExpoModulesCore\nlet quote = /"/\n@ExpoModule\npublic final class QuoteModule: Module {}',
      });

      await expect(getSwiftInlineModuleInfo('/example-project/QuoteModule.swift')).resolves.toEqual(
        {
          hasModuleDefinition: true,
          declaredWithMacro: true,
        }
      );
    });
  });

  describe('stripSwiftCommentsAndStrings', () => {
    it('removes line, block and nested block comments', () => {
      expect(stripSwiftCommentsAndStrings('a // b\nc /* d /* e */ f */ g')).toBe('a \nc   g');
    });

    it('empties string literals, keeping escaped quotes inside them', () => {
      expect(stripSwiftCommentsAndStrings('a "b \\" // c" d')).toBe('a "" d');
    });

    it('empties multiline and raw strings', () => {
      expect(stripSwiftCommentsAndStrings('a """\n"b"\n""" c ##"x"# "##d')).toBe('a "" c ""d');
    });

    it('keeps code that only looks like a raw string', () => {
      expect(stripSwiftCommentsAndStrings('#if DEBUG\n#selector(f)\n#endif')).toBe(
        '#if DEBUG\n#selector(f)\n#endif'
      );
    });

    it('keeps an interpolation from ending the string early', () => {
      expect(stripSwiftCommentsAndStrings('a "\\(String("@ExpoModule"))" b')).toBe('a "" b');
      expect(stripSwiftCommentsAndStrings('a "\\(f("/*"), g(1))" @ExpoModule')).toBe(
        'a "" @ExpoModule'
      );
    });

    it('handles escapes and interpolations of raw strings', () => {
      expect(stripSwiftCommentsAndStrings('a #"\\#"@ExpoModule"# b')).toBe('a "" b');
      expect(stripSwiftCommentsAndStrings('a #"\\#(f(")"))"# b')).toBe('a "" b');
    });

    it('empties regex literals but keeps divisions', () => {
      expect(stripSwiftCommentsAndStrings('let q = /"/\nlet r = #/"/#\nlet d = a / b / c')).toBe(
        'let q = ""\nlet r = ""\nlet d = a / b / c'
      );
      expect(stripSwiftCommentsAndStrings('return /a"b/')).toBe('return ""');
      expect(stripSwiftCommentsAndStrings('let d = x/y; let e = f(x)/2')).toBe(
        'let d = x/y; let e = f(x)/2'
      );
    });

    it('ends an unterminated single-line string at the end of its line', () => {
      expect(stripSwiftCommentsAndStrings('let s = "abc\n@ExpoModule')).toBe(
        'let s = ""\n@ExpoModule'
      );
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

    it('detects an inline module declared with the @ExpoModule macro', async () => {
      vol.fromJSON({
        '/example-project/GreeterModule.swift':
          'import ExpoModulesCore\n@ExpoModule\npublic final class GreeterModule: Module {\n  @JS\n  func greet(name: String) -> String { "Hi, \\(name)" }\n}',
      });

      await expect(hasSwiftModuleDefinition('/example-project/GreeterModule.swift')).resolves.toBe(
        true
      );
    });

    it('detects an inline module declared with the @ExpoModule macro and arguments', async () => {
      vol.fromJSON({
        '/example-project/GreeterModule.swift':
          'import ExpoModulesCore\n@ExpoModule("Greeter", classes: [Greeting.self])\npublic final class GreeterModule: Module {}',
      });

      await expect(hasSwiftModuleDefinition('/example-project/GreeterModule.swift')).resolves.toBe(
        true
      );
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
        swiftExpoModuleClassNames: [],
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
        swiftExpoModuleClassNames: [],
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
        swiftExpoModuleClassNames: [],
        kotlinClasses: ['some.simple.package.SimpleModule', 'other.package.SimpleView'],
      };

      await generateInlineModulesListFile(listPath, mockMirror);

      const targetFile = '/build/generated/ExpoInlineModulesList.kt';

      expect(fs.existsSync(targetFile)).toBe(true);

      const content = await fs.promises.readFile(targetFile, 'utf8');

      expect(content).toContain('some.simple.package.SimpleModule::class.java to "SimpleModule"');
      expect(content).toContain('other.package.SimpleView::class.java to "SimpleView"');
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
