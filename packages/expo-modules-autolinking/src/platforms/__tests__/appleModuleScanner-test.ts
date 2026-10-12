import { vol } from 'memfs';

import {
  collectPackageRoots,
  groupScannedModules,
  hasModuleAnnotations,
  scanExpoModulesAsync,
  type ModulesScanner,
  type ScanModulesOutput,
} from '../apple/moduleScanner';

afterEach(() => {
  vol.reset();
});

const ALL_PLATFORMS = ['iOS', 'macOS', 'tvOS'];

const packageRoots: Record<string, string> = {
  'expo-clipboard': '/app/node_modules/expo-clipboard',
  'expo-camera': '/app/node_modules/expo-camera',
};

function scannerOutput(partial: Partial<ScanModulesOutput>): ScanModulesOutput {
  return {
    schemaVersion: 2,
    modules: [],
    warnings: [],
    stats: { filesScanned: 0, filesParsed: 0, durationMs: 0 },
    ...partial,
  };
}

function mockScanner(result: ScanModulesOutput | Error): ModulesScanner {
  return {
    scanModules: jest.fn(() =>
      result instanceof Error ? Promise.reject(result) : Promise.resolve(result)
    ),
  };
}

describe(scanExpoModulesAsync, () => {
  it('scans every package root with a timeout', async () => {
    const scanner = mockScanner(scannerOutput({}));

    await scanExpoModulesAsync(scanner, packageRoots);

    expect(scanner.scanModules).toHaveBeenCalledWith(
      ['/app/node_modules/expo-clipboard', '/app/node_modules/expo-camera'],
      { timeout: 5000 }
    );
  });

  it('never writes to stdout, which must stay parseable for resolve --json', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    await scanExpoModulesAsync(mockScanner(new Error('scan failure')), packageRoots);
    await scanExpoModulesAsync(mockScanner(scannerOutput({})), packageRoots);

    expect(log).not.toHaveBeenCalled();
  });

  it('returns the scan result', async () => {
    const output = scannerOutput({
      modules: [
        {
          name: 'ClipboardModule',
          jsName: 'Clipboard',
          accessLevel: 'public',
          file: '/app/node_modules/expo-clipboard/ios/ClipboardModule.swift',
          platforms: ALL_PLATFORMS,
        },
      ],
    });

    expect(await scanExpoModulesAsync(mockScanner(output), packageRoots)).toBe(output);
  });

  it('returns null and warns when the scan fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();

    expect(
      await scanExpoModulesAsync(
        mockScanner(new Error('`scan-modules` returned schema version 3')),
        packageRoots
      )
    ).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^warning: .*only modules declared.*schema version 3/)
    );
  });

  it('returns null without scanning when there are no package roots', async () => {
    const scanner = mockScanner(scannerOutput({}));

    expect(await scanExpoModulesAsync(scanner, {})).toBeNull();
    expect(scanner.scanModules).not.toHaveBeenCalled();
  });

  it('prints the scanner warnings with their locations', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    const output = scannerOutput({
      warnings: [
        {
          message: "cannot evaluate 'canImport(SomeSDK)' in a static scan",
          file: '/app/node_modules/expo-camera/ios/CameraModule.swift',
          line: 3,
        },
      ],
    });

    await scanExpoModulesAsync(mockScanner(output), packageRoots);

    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/CameraModule\.swift:3: warning: .+canImport\(SomeSDK\)/)
    );
  });
});

describe(groupScannedModules, () => {
  it('assigns each module to the package whose root contains its file', () => {
    const output = scannerOutput({
      modules: [
        {
          name: 'ClipboardModule',
          jsName: 'Clipboard',
          accessLevel: 'public',
          file: '/app/node_modules/expo-clipboard/ios/ClipboardModule.swift',
          platforms: ALL_PLATFORMS,
        },
        {
          name: 'CameraModule',
          jsName: 'CameraModule',
          accessLevel: 'open',
          file: '/app/node_modules/expo-camera/ios/CameraModule.swift',
          platforms: ALL_PLATFORMS,
        },
      ],
    });

    const grouped = groupScannedModules(output, packageRoots, 'ios');

    // The registration name stays null: the module's own `Name(...)` DSL entry and the macro's
    // `_jsName` must keep precedence, exactly as for config-declared string entries.
    expect(grouped).toEqual({
      'expo-clipboard': [{ name: null, class: 'ClipboardModule' }],
      'expo-camera': [{ name: null, class: 'CameraModule' }],
    });
  });

  it('excludes classes that are not public or open, with a warning', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    const output = scannerOutput({
      modules: [
        {
          name: 'InternalModule',
          jsName: 'InternalModule',
          accessLevel: 'internal',
          file: '/app/node_modules/expo-clipboard/ios/InternalModule.swift',
          platforms: ALL_PLATFORMS,
        },
        {
          name: 'PrivateModule',
          jsName: 'PrivateModule',
          accessLevel: 'private',
          file: '/app/node_modules/expo-clipboard/ios/Tests/PrivateModule.swift',
          platforms: ALL_PLATFORMS,
        },
      ],
    });

    const grouped = groupScannedModules(output, packageRoots, 'ios');

    expect(grouped).toEqual({});
    // The internal (default) access level is likely unintentional, so it warns; the explicitly
    // spelled private one is a deliberate opt-out (e.g. a test fixture) and stays quiet.
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/InternalModule.+public/));
  });

  it('ignores modules outside of every package root', () => {
    const output = scannerOutput({
      modules: [
        {
          name: 'StrayModule',
          jsName: 'StrayModule',
          accessLevel: 'public',
          file: '/somewhere/else/StrayModule.swift',
          platforms: ALL_PLATFORMS,
        },
      ],
    });

    expect(groupScannedModules(output, packageRoots, 'ios')).toEqual({});
  });

  it('skips a class that does not compile for the platform being linked', () => {
    // From schema 2 the scanner reports each module's platforms instead of omitting conditional
    // ones. The provider references a class by name, so emitting one the target can't see would
    // fail the build.
    const output = scannerOutput({
      schemaVersion: 2,
      modules: [
        {
          name: 'TvOnlyModule',
          jsName: 'TvOnlyModule',
          accessLevel: 'public',
          file: '/app/node_modules/expo-camera/ios/TvOnlyModule.swift',
          platforms: ['tvOS'],
        },
        {
          name: 'CameraModule',
          jsName: 'CameraModule',
          accessLevel: 'public',
          file: '/app/node_modules/expo-camera/ios/CameraModule.swift',
          platforms: ['iOS', 'tvOS'],
        },
      ],
    });

    expect(groupScannedModules(output, packageRoots, 'ios')).toEqual({
      'expo-camera': [{ name: null, class: 'CameraModule' }],
    });
    expect(groupScannedModules(output, packageRoots, 'tvos')).toEqual({
      'expo-camera': [
        { name: null, class: 'TvOnlyModule' },
        { name: null, class: 'CameraModule' },
      ],
    });
  });

  it('skips a class whose compilation condition the scanner could not evaluate', () => {
    // An empty list is how the scanner reports `#if DEBUG` or `canImport(...)`, which it warns
    // about separately. Declaring the class in the module config stays the way to link it.
    const output = scannerOutput({
      schemaVersion: 2,
      modules: [
        {
          name: 'DebugOnlyModule',
          jsName: 'DebugOnlyModule',
          accessLevel: 'public',
          file: '/app/node_modules/expo-camera/ios/DebugOnlyModule.swift',
          platforms: [],
        },
      ],
    });

    expect(groupScannedModules(output, packageRoots, 'ios')).toEqual({});
  });

  it('links every reported class for the umbrella apple platform', () => {
    // Pods resolve for `apple`, which has no single target to match against.
    const output = scannerOutput({
      schemaVersion: 2,
      modules: [
        {
          name: 'TvOnlyModule',
          jsName: 'TvOnlyModule',
          accessLevel: 'public',
          file: '/app/node_modules/expo-camera/ios/TvOnlyModule.swift',
          platforms: ['tvOS'],
        },
      ],
    });

    expect(groupScannedModules(output, packageRoots, 'apple')).toEqual({
      'expo-camera': [{ name: null, class: 'TvOnlyModule' }],
    });
  });

  it('skips malformed entries instead of failing the whole report', () => {
    // `isPathInside` throws on a non-string path, which would escape the scan's error handling.
    const output = scannerOutput({
      modules: [
        { name: 'NoFile', jsName: 'NoFile', accessLevel: 'public' },
        {
          jsName: 'NoName',
          accessLevel: 'public',
          file: '/app/node_modules/expo-camera/ios/A.swift',
          platforms: ALL_PLATFORMS,
        },
        {
          name: 'CameraModule',
          jsName: 'CameraModule',
          accessLevel: 'public',
          file: '/app/node_modules/expo-camera/ios/CameraModule.swift',
          platforms: ALL_PLATFORMS,
        },
      ] as any,
    });

    expect(groupScannedModules(output, packageRoots, 'ios')).toEqual({
      'expo-camera': [{ name: null, class: 'CameraModule' }],
    });
  });

  it('reports a module found under overlapping roots only once', () => {
    // A package nested inside another one (a hoisted npm or yarn install) makes the scanner walk
    // the nested directory once per containing root and report its modules once per walk. Linking
    // the same class twice would register the module twice in the runtime.
    const nestedRoots = {
      'expo-camera': '/app/node_modules/expo-camera',
      'expo-camera-next': '/app/node_modules/expo-camera/node_modules/expo-camera-next',
    };
    const scannedModule = {
      name: 'NextCameraModule',
      jsName: 'NextCameraModule',
      accessLevel: 'public',
      file: '/app/node_modules/expo-camera/node_modules/expo-camera-next/ios/NextCameraModule.swift',
      platforms: ALL_PLATFORMS,
    } as const;
    const output = scannerOutput({ modules: [scannedModule, scannedModule] });

    const grouped = groupScannedModules(output, nestedRoots, 'ios');

    expect(grouped).toEqual({
      'expo-camera-next': [{ name: null, class: 'NextCameraModule' }],
    });
  });

  it('warns once about an internal class reported several times', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    const scannedModule = {
      name: 'InternalModule',
      jsName: 'InternalModule',
      accessLevel: 'internal',
      file: '/app/node_modules/expo-clipboard/ios/InternalModule.swift',
      platforms: ALL_PLATFORMS,
    } as const;
    const output = scannerOutput({ modules: [scannedModule, scannedModule] });

    groupScannedModules(output, packageRoots, 'ios');

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('links a class declared in several files of one package only once', () => {
    // A package can declare the same class name in per-platform files behind conditional
    // compilation. Only one of them ever compiles, and the provider references the class by name,
    // so the tuple must be emitted once no matter how many declarations the scan reports.
    const output = scannerOutput({
      modules: [
        {
          name: 'CameraModule',
          jsName: 'CameraModule',
          accessLevel: 'public',
          file: '/app/node_modules/expo-camera/ios/CameraModule.swift',
          platforms: ALL_PLATFORMS,
        },
        {
          name: 'CameraModule',
          jsName: 'CameraModule',
          accessLevel: 'public',
          file: '/app/node_modules/expo-camera/tvos/CameraModule.swift',
          platforms: ALL_PLATFORMS,
        },
      ],
    });

    const grouped = groupScannedModules(output, packageRoots, 'ios');

    expect(grouped).toEqual({
      'expo-camera': [{ name: null, class: 'CameraModule' }],
    });
  });

  it('prefers the longest matching root for nested package paths', () => {
    const nestedRoots = {
      'expo-camera': '/app/node_modules/expo-camera',
      'expo-camera-next': '/app/node_modules/expo-camera/next',
    };
    const output = scannerOutput({
      modules: [
        {
          name: 'NextCameraModule',
          jsName: 'NextCameraModule',
          accessLevel: 'public',
          file: '/app/node_modules/expo-camera/next/ios/NextCameraModule.swift',
          platforms: ALL_PLATFORMS,
        },
      ],
    });

    const grouped = groupScannedModules(output, nestedRoots, 'ios');

    expect(grouped).toEqual({
      'expo-camera-next': [{ name: null, class: 'NextCameraModule' }],
    });
  });
});

describe(collectPackageRoots, () => {
  it('resolves symlinked package paths to their real directories', () => {
    vol.fromJSON({ '/store/expo-camera/package.json': '{}' });
    vol.mkdirSync('/app/node_modules', { recursive: true });
    vol.symlinkSync('/store/expo-camera', '/app/node_modules/expo-camera');

    const roots = collectPackageRoots({
      'expo-camera': {
        name: 'expo-camera',
        path: '/app/node_modules/expo-camera',
        version: '1.0.0',
      },
    });

    // The scanner reports fully resolved absolute paths, so the roots used for the path-prefix
    // grouping must be resolved the same way, or a symlinked package matches nothing.
    expect(roots).toEqual({ 'expo-camera': '/store/expo-camera' });
  });

  it('deduplicates package names sharing one directory, keeping the first', () => {
    vol.fromJSON({ '/app/node_modules/expo-camera/package.json': '{}' });

    const roots = collectPackageRoots({
      'expo-camera': {
        name: 'expo-camera',
        path: '/app/node_modules/expo-camera',
        version: '1.0.0',
      },
      'camera-alias': {
        name: 'camera-alias',
        path: '/app/node_modules/expo-camera',
        version: '1.0.0',
      },
    });

    expect(roots).toEqual({ 'expo-camera': '/app/node_modules/expo-camera' });
  });

  it('skips packages whose path does not exist', () => {
    expect(
      collectPackageRoots({
        gone: { name: 'gone', path: '/nonexistent/gone', version: '1.0.0' },
      })
    ).toEqual({});
  });
});

describe(hasModuleAnnotations, () => {
  it('finds an @ExpoModule attribute in a nested Swift source', () => {
    vol.fromJSON({
      '/app/node_modules/expo-haptics/ios/Sources/HapticsModule.swift':
        'import ExpoModulesCore\n\n@ExpoModule("ExpoHaptics")\npublic class HapticsModule: Module {}\n',
    });
    expect(hasModuleAnnotations('/app/node_modules/expo-haptics')).toBe(true);
  });

  it('ignores mentions in comments and non-Swift files', () => {
    vol.fromJSON({
      '/app/node_modules/expo-modules-core/ios/ModuleHolder.swift':
        '/// Set by the `@ExpoModule` macro.\nlet name = "x"\n',
      '/app/node_modules/expo-modules-core/README.md': '@ExpoModule\n',
    });
    expect(hasModuleAnnotations('/app/node_modules/expo-modules-core')).toBe(false);
  });

  it('skips the directories the scanner prunes', () => {
    vol.fromJSON({
      '/app/node_modules/expo-foo/ios/Tests/FooTests.swift': '@ExpoModule\nclass FooModule {}\n',
      '/app/node_modules/expo-foo/example/ios/App.swift': '@ExpoModule\nclass AppModule {}\n',
      '/app/node_modules/expo-foo/node_modules/expo-bar/ios/Bar.swift':
        '@ExpoModule\npublic class BarModule {}\n',
    });
    expect(hasModuleAnnotations('/app/node_modules/expo-foo')).toBe(false);
  });

  it('returns false for a missing directory', () => {
    expect(hasModuleAnnotations('/nonexistent')).toBe(false);
  });
});
