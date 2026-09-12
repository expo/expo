import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import {
  collectPackageRoots,
  groupScannedModules,
  satisfiesMinimumVersion,
  scanExpoModulesAsync,
  type ScannerPluginInfo,
  type ScanModulesOutput,
} from '../apple/moduleScanner';

jest.mock('@expo/spawn-async');

afterEach(() => {
  vol.reset();
});

const mockSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;

const pluginInfo: ScannerPluginInfo = {
  binaryPath: '/app/node_modules/@expo/expo-modules-macros-plugin/apple/ExpoModulesMacros-tool',
  version: '0.9.0',
};

const packageRoots: Record<string, string> = {
  'expo-clipboard': '/app/node_modules/expo-clipboard',
  'expo-camera': '/app/node_modules/expo-camera',
};

function scannerOutput(partial: Partial<ScanModulesOutput>): ScanModulesOutput {
  return {
    schemaVersion: 1,
    modules: [],
    warnings: [],
    stats: { filesScanned: 0, filesParsed: 0, durationMs: 0 },
    ...partial,
  };
}

function mockScannerResult(output: ScanModulesOutput) {
  mockSpawnAsync.mockResolvedValueOnce({
    stdout: JSON.stringify(output),
  } as any);
}

describe(scanExpoModulesAsync, () => {
  it('invokes the scanner binary with every package root', async () => {
    mockScannerResult(scannerOutput({}));

    await scanExpoModulesAsync(pluginInfo, packageRoots);

    expect(mockSpawnAsync).toHaveBeenCalledWith(
      pluginInfo.binaryPath,
      ['scan-modules', '/app/node_modules/expo-clipboard', '/app/node_modules/expo-camera'],
      // stdin must be closed: given scanner arguments, a pre-CLI binary starts the compiler plugin
      // server and reads stdin forever, which would hang pod install. With no stdin it exits
      // immediately and falls into the JSON parsing failure path instead.
      expect.objectContaining({ stdio: ['ignore', 'pipe', 'pipe'] })
    );
  });

  it('never writes to stdout, which must stay parseable for resolve --json', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    mockSpawnAsync.mockRejectedValueOnce(new Error('spawn failure'));
    await scanExpoModulesAsync(pluginInfo, packageRoots);

    mockScannerResult(scannerOutput({}));
    await scanExpoModulesAsync(pluginInfo, packageRoots);

    expect(log).not.toHaveBeenCalled();
  });

  it('parses the scanner JSON output', async () => {
    mockScannerResult(
      scannerOutput({
        modules: [
          {
            name: 'ClipboardModule',
            jsName: 'Clipboard',
            accessLevel: 'public',
            file: '/app/node_modules/expo-clipboard/ios/ClipboardModule.swift',
          },
        ],
      })
    );

    const output = await scanExpoModulesAsync(pluginInfo, packageRoots);

    expect(output?.modules).toHaveLength(1);
    expect(output?.modules[0]?.name).toBe('ClipboardModule');
  });

  it('returns null and warns when the schema version is older than supported', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    mockScannerResult(scannerOutput({ schemaVersion: 0 }));

    expect(await scanExpoModulesAsync(pluginInfo, packageRoots)).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('schema version'));
  });

  it('accepts output with a newer schema version', async () => {
    mockScannerResult(scannerOutput({ schemaVersion: 1000 }));

    expect(await scanExpoModulesAsync(pluginInfo, packageRoots)).not.toBeNull();
  });

  it('returns null and warns when the scanner fails to run', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    mockSpawnAsync.mockRejectedValueOnce(new Error('spawn failure'));

    expect(await scanExpoModulesAsync(pluginInfo, packageRoots)).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('spawn failure'));
  });

  it('returns null and warns when the output is not JSON', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    mockSpawnAsync.mockResolvedValueOnce({ stdout: '' } as any);

    expect(await scanExpoModulesAsync(pluginInfo, packageRoots)).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('only modules declared'));
  });

  it('returns null and warns when the report is malformed', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    mockScannerResult({ schemaVersion: 1, modules: 'nope', warnings: null } as any);

    expect(await scanExpoModulesAsync(pluginInfo, packageRoots)).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('only modules declared'));
  });

  it('forwards the scanner stderr of a successful run', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    mockSpawnAsync.mockResolvedValueOnce({
      stdout: JSON.stringify(scannerOutput({})),
      stderr: 'warning: could not read /app/node_modules/expo-camera/ios/Broken.swift\n',
    } as any);

    expect(await scanExpoModulesAsync(pluginInfo, packageRoots)).not.toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('could not read'));
  });

  it('includes the scanner stderr in the failure warning', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    mockSpawnAsync.mockRejectedValueOnce(
      Object.assign(new Error('exited with non-zero code: 2'), {
        stderr: "error: unknown subcommand 'scan-everything'\n",
      })
    );

    expect(await scanExpoModulesAsync(pluginInfo, packageRoots)).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("unknown subcommand 'scan-everything'")
    );
  });

  it('returns null without scanning when there are no package roots', async () => {
    expect(await scanExpoModulesAsync(pluginInfo, {})).toBeNull();
    expect(mockSpawnAsync).not.toHaveBeenCalled();
  });

  it('prints the scanner warnings with their locations', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    mockScannerResult(
      scannerOutput({
        warnings: [
          {
            message: "cannot evaluate 'canImport(SomeSDK)' in a static scan",
            file: '/app/node_modules/expo-camera/ios/CameraModule.swift',
            line: 3,
          },
        ],
      })
    );

    await scanExpoModulesAsync(pluginInfo, packageRoots);

    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/CameraModule\.swift:3.+canImport\(SomeSDK\)/)
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
        },
        {
          name: 'CameraModule',
          jsName: 'CameraModule',
          accessLevel: 'open',
          file: '/app/node_modules/expo-camera/ios/CameraModule.swift',
        },
      ],
    });

    const grouped = groupScannedModules(output, packageRoots);

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
        },
        {
          name: 'PrivateModule',
          jsName: 'PrivateModule',
          accessLevel: 'private',
          file: '/app/node_modules/expo-clipboard/ios/Tests/PrivateModule.swift',
        },
      ],
    });

    const grouped = groupScannedModules(output, packageRoots);

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
        },
      ],
    });

    expect(groupScannedModules(output, packageRoots)).toEqual({});
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
        },
      ],
    });

    const grouped = groupScannedModules(output, nestedRoots);

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

describe(satisfiesMinimumVersion, () => {
  it.each([
    ['0.8.0', false],
    ['0.9.0', true],
    ['0.10.0', true],
    ['1.0.0', true],
    // Accepted as a documented choice: a prerelease of the minimum version is assumed to carry
    // the capability. A prerelease published before the capability landed is handled by the
    // closed-stdin spawn, which makes such a binary exit instead of hanging.
    ['0.9.0-rc.1', true],
    ['garbage', false],
    ['', false],
  ])('%s -> %s', (version, expected) => {
    expect(satisfiesMinimumVersion(version, [0, 9, 0])).toBe(expected);
  });
});
