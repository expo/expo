import plist from '@expo/plist';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildExtensionSource,
  buildInfoPlist,
  writeExtensionFiles,
} from '../ios/crashReporterExtensionFiles';

describe(buildInfoPlist, () => {
  it('declares the crash reporter extension point', () => {
    expect(plist.parse(buildInfoPlist())).toEqual({
      EXAppExtensionAttributes: {
        EXExtensionPointIdentifier: 'com.apple.crash-reporter.extension',
      },
    });
  });
});

describe(buildExtensionSource, () => {
  it('declares the extension type for the device SDK and a stub for the simulator', () => {
    const source = buildExtensionSource('MyCrashReporter');
    expect(source).toContain('#if canImport(CrashReportExtension)');
    expect(source).toContain('struct MyCrashReporter: CrashReporterExtension {');
    expect(source).toContain('func processCrashReport(process: CrashedProcess)');
    expect(source).toContain('#else');
    expect(source).toMatch(/struct MyCrashReporter \{\n\s+static func main\(\) \{\}/);
    expect(source.match(/@main/g)).toHaveLength(2);
  });
});

describe(writeExtensionFiles, () => {
  let platformProjectRoot: string;

  beforeEach(() => {
    platformProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-observe-plugin-'));
  });

  afterEach(() => {
    fs.rmSync(platformProjectRoot, { recursive: true, force: true });
  });

  it('writes the Info.plist and Swift file to a folder named after the target', async () => {
    await writeExtensionFiles(platformProjectRoot, 'MyCrashReporter');
    const directory = path.join(platformProjectRoot, 'MyCrashReporter');
    expect(fs.readdirSync(directory).sort()).toEqual(['Info.plist', 'MyCrashReporter.swift']);
    expect(fs.readFileSync(path.join(directory, 'Info.plist'), 'utf8')).toBe(buildInfoPlist());
    expect(fs.readFileSync(path.join(directory, 'MyCrashReporter.swift'), 'utf8')).toBe(
      buildExtensionSource('MyCrashReporter')
    );
  });

  it('overwrites files from an earlier prebuild', async () => {
    const directory = path.join(platformProjectRoot, 'MyCrashReporter');
    fs.mkdirSync(directory);
    fs.writeFileSync(path.join(directory, 'MyCrashReporter.swift'), '// edited by hand');
    await writeExtensionFiles(platformProjectRoot, 'MyCrashReporter');
    expect(fs.readFileSync(path.join(directory, 'MyCrashReporter.swift'), 'utf8')).toBe(
      buildExtensionSource('MyCrashReporter')
    );
  });
});
