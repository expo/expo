import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveBuildConfigIos } from '../../../cli/src/utils/config';
import { validateHostProvided } from '../../../cli/src/utils/ios';
import type { IosConfig } from '../../../cli/src/utils/types';

/**
 * Unit tests for `validateHostProvided`. The function is run before the build kicks off and is
 * responsible for catching misconfigurations (source build with host-provided frameworks, typo'd
 * framework names) before the user hits a confusing "Multiple commands produce" or runtime crash.
 *
 * The function reads `Pods/<pod>/<name>.xcframework/<slice>/<name>.framework/Info.plist` from
 * `process.cwd()`, so each test chdir's into a synthetic project tree.
 */
describe('validateHostProvided', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brownfield-host-provided-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const baseConfig = (overrides: Partial<IosConfig> = {}): IosConfig => ({
    artifacts: path.join(tmpDir, 'artifacts'),
    buildConfiguration: 'Release',
    derivedDataPath: path.join(tmpDir, 'ios', 'build'),
    device: path.join(tmpDir, 'ios', 'build', 'release-iphoneos'),
    dryRun: false,
    hostProvidedFrameworks: [],
    output: 'frameworks',
    scheme: 'TestBrownfield',
    simulator: path.join(tmpDir, 'ios', 'build', 'release-iphonesimulator'),
    usePrebuilds: true,
    verbose: false,
    workspace: path.join(tmpDir, 'ios', 'test.xcworkspace'),
    ...overrides,
  });

  /**
   * Writes a minimal xcframework directory tree containing one slice with a framework whose
   * Info.plist declares `CFBundleShortVersionString`. Enough to exercise the version-extraction
   * codepath without needing a real lipo-built binary.
   */
  const seedXcframework = (podName: string, frameworkName: string, version: string) => {
    const sliceDir = path.join(
      tmpDir,
      'ios',
      'Pods',
      podName,
      `${frameworkName}.xcframework`,
      'ios-arm64',
      `${frameworkName}.framework`
    );
    fs.mkdirSync(sliceDir, { recursive: true });
    fs.writeFileSync(
      path.join(sliceDir, 'Info.plist'),
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleShortVersionString</key><string>${version}</string>
</dict></plist>`
    );
  };

  it('is a no-op when hostProvidedFrameworks is empty', () => {
    expect(() => validateHostProvided(baseConfig())).not.toThrow();
  });

  it('logs the resolved version of each excluded framework when found in ios/Pods', () => {
    seedXcframework('ExpoImage', 'SDWebImage', '5.21.6');
    seedXcframework('ExpoImage', 'SDWebImageWebPCoder', '0.14.7');

    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      validateHostProvided(
        baseConfig({ hostProvidedFrameworks: ['SDWebImage', 'SDWebImageWebPCoder'] })
      );
    } finally {
      log.mockRestore();
    }

    const messages = log.mock.calls.map(([msg]) => String(msg));
    expect(messages.some((m) => m.includes('SDWebImage') && m.includes('5.21.6'))).toBe(true);
    expect(messages.some((m) => m.includes('SDWebImageWebPCoder') && m.includes('0.14.7'))).toBe(
      true
    );
  });

  it('warns when a host-provided name does not match any installed xcframework', () => {
    seedXcframework('ExpoImage', 'SDWebImage', '5.21.6');

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      validateHostProvided(
        baseConfig({ hostProvidedFrameworks: ['SDWebImage', 'NotInstalledKit'] })
      );
    } finally {
      warn.mockRestore();
    }

    const warnings = warn.mock.calls.map(([msg]) => String(msg));
    expect(warnings.some((m) => m.includes('NotInstalledKit'))).toBe(true);
    // SDWebImage was actually installed — it shouldn't get the unused-name warning.
    expect(warnings.some((m) => m.includes("'SDWebImage'"))).toBe(false);
  });

  it('exits with a clear error when hostProvidedFrameworks is set but usePrebuilds is false', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      validateHostProvided(
        baseConfig({ usePrebuilds: false, hostProvidedFrameworks: ['SDWebImage'] })
      );
    } finally {
      exit.mockRestore();
      errLog.mockRestore();
    }

    expect(exit).toHaveBeenCalledWith(1);
    const messages = errLog.mock.calls.map(([msg]) => String(msg));
    expect(messages.some((m) => m.includes('precompiled modules are not enabled'))).toBe(true);
  });

  it('reads hostProvidedFrameworks from ios/Podfile.properties.json (the prebuild bridge)', () => {
    // The plugin writes a JSON-stringified array under `ios.brownfieldHostProvidedFrameworks`
    // during prebuild. The CLI reads it back here when no --host-provided flag is passed.
    const iosDir = path.join(tmpDir, 'ios');
    fs.mkdirSync(iosDir, { recursive: true });
    fs.writeFileSync(
      path.join(iosDir, 'Podfile.properties.json'),
      JSON.stringify({
        'ios.brownfieldHostProvidedFrameworks': JSON.stringify([
          'SDWebImage',
          ' SDWebImageWebPCoder ', // confirms trim
          'SDWebImage', // confirms dedupe
        ]),
      })
    );
    // The CLI also tries to find a workspace + scheme; provide minimal stubs.
    fs.mkdirSync(path.join(iosDir, 'TestBrownfield', 'ReactNativeHostManager.swift'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(iosDir, 'TestBrownfield', 'ReactNativeHostManager.swift', 'placeholder.swift'),
      ''
    );
    fs.mkdirSync(path.join(iosDir, 'test.xcworkspace'), { recursive: true });

    const config = resolveBuildConfigIos({
      release: true,
      scheme: 'TestBrownfield',
      xcworkspace: path.join(iosDir, 'test.xcworkspace'),
      dryRun: true,
    });

    expect(config.hostProvidedFrameworks).toEqual(['SDWebImage', 'SDWebImageWebPCoder']);
  });

  it('lets the --host-provided CLI flag override Podfile.properties.json', () => {
    const iosDir = path.join(tmpDir, 'ios');
    fs.mkdirSync(iosDir, { recursive: true });
    fs.writeFileSync(
      path.join(iosDir, 'Podfile.properties.json'),
      JSON.stringify({
        'ios.brownfieldHostProvidedFrameworks': JSON.stringify(['SDWebImage']),
      })
    );
    fs.mkdirSync(path.join(iosDir, 'TestBrownfield'), { recursive: true });
    fs.writeFileSync(
      path.join(iosDir, 'TestBrownfield', 'ReactNativeHostManager.swift'),
      ''
    );
    fs.mkdirSync(path.join(iosDir, 'test.xcworkspace'), { recursive: true });

    const config = resolveBuildConfigIos({
      release: true,
      scheme: 'TestBrownfield',
      xcworkspace: path.join(iosDir, 'test.xcworkspace'),
      dryRun: true,
      hostProvided: ['lottie-ios,MMKV'],
    });

    expect(config.hostProvidedFrameworks).toEqual(['lottie-ios', 'MMKV']);
  });

  it('logs an unknown-version label when the xcframework Info.plist is unreadable', () => {
    // Seed a xcframework dir but no Info.plist inside the slice.
    const sliceDir = path.join(
      tmpDir,
      'ios',
      'Pods',
      'ExpoImage',
      'SDWebImage.xcframework',
      'ios-arm64',
      'SDWebImage.framework'
    );
    fs.mkdirSync(sliceDir, { recursive: true });

    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      validateHostProvided(baseConfig({ hostProvidedFrameworks: ['SDWebImage'] }));
    } finally {
      log.mockRestore();
    }

    const messages = log.mock.calls.map(([msg]) => String(msg));
    expect(messages.some((m) => m.includes('SDWebImage') && m.includes('unknown version'))).toBe(
      true
    );
  });
});
