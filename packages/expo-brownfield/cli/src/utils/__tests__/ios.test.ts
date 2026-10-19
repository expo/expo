import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as iosUtils from '../ios';
import type { IosConfig } from '../types';

jest.mock('@expo/spawn-async', () => jest.fn());

const mockSpawn = spawnAsync as jest.MockedFunction<typeof spawnAsync>;

let tmpDir: string;

const makeConfig = (overrides: Partial<IosConfig> = {}): IosConfig => ({
  artifacts: path.join(tmpDir, 'artifacts'),
  buildConfiguration: 'Release',
  derivedDataPath: path.join(tmpDir, 'ios/build'),
  device: path.join(tmpDir, 'ios/build/Build/Products/release-iphoneos'),
  dryRun: false,
  hostProvidedFrameworks: [],
  output: 'frameworks',
  scheme: 'MyKit',
  simulator: path.join(tmpDir, 'ios/build/Build/Products/release-iphonesimulator'),
  usePrebuilds: false,
  verbose: false,
  workspace: path.join(tmpDir, 'ios/App.xcworkspace'),
  ...overrides,
});

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brownfield-ios-'));
  mockSpawn.mockReset();
  mockSpawn.mockRejectedValue(new Error('spawnAsync not stubbed'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

describe('createXCframework', () => {
  it('resolves the scheme framework under XCFrameworkIntermediates/ when it is not at the slice root', async () => {
    const config = makeConfig({ dryRun: true });
    const deviceFramework = path.join(
      config.device,
      'XCFrameworkIntermediates',
      'MyKit',
      'MyKit.framework'
    );
    const simulatorFramework = path.join(
      config.simulator,
      'XCFrameworkIntermediates',
      'MyKit',
      'MyKit.framework'
    );
    fs.mkdirSync(deviceFramework, { recursive: true });
    fs.mkdirSync(simulatorFramework, { recursive: true });

    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await iosUtils.createXCframework(config, config.artifacts);

    const command = log.mock.calls.map((args) => args.join(' ')).join('\n');
    expect(command).toContain(deviceFramework);
    expect(command).toContain(simulatorFramework);
  });

  it('uses the slice root when the framework is there', async () => {
    const config = makeConfig({ dryRun: true });
    const deviceFramework = path.join(config.device, 'MyKit.framework');
    const simulatorFramework = path.join(config.simulator, 'MyKit.framework');
    fs.mkdirSync(deviceFramework, { recursive: true });
    fs.mkdirSync(simulatorFramework, { recursive: true });

    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await iosUtils.createXCframework(config, config.artifacts);

    const command = log.mock.calls.map((args) => args.join(' ')).join('\n');
    expect(command).toContain(deviceFramework);
    expect(command).toContain(simulatorFramework);
  });

  it('fails with a clear error when the built framework cannot be found', async () => {
    const config = makeConfig();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    await expect(iosUtils.createXCframework(config, config.artifacts)).rejects.toThrow(
      'process.exit'
    );
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe('enumerateSourceBuiltDeps', () => {
  it('finds the scheme binary under XCFrameworkIntermediates/ and reads its linked frameworks', async () => {
    const config = makeConfig();
    const frameworkDir = path.join(
      config.simulator,
      'XCFrameworkIntermediates',
      'MyKit',
      'MyKit.framework'
    );
    fs.mkdirSync(frameworkDir, { recursive: true });
    fs.writeFileSync(path.join(frameworkDir, 'MyKit'), 'binary');

    mockSpawn.mockResolvedValue({
      stdout: [
        `${path.join(frameworkDir, 'MyKit')}:`,
        '\t@rpath/MyKit.framework/MyKit (compatibility version 1.0.0, current version 1.0.0)',
        '\t@rpath/ExpoModulesJSI.framework/ExpoModulesJSI (compatibility version 1.0.0, current version 1.0.0)',
        '\t/usr/lib/libc++.1.dylib (compatibility version 1.0.0, current version 1800.101.0)',
      ].join('\n'),
    } as any);

    const deps = await iosUtils.enumerateSourceBuiltDeps(config, new Set());
    expect(deps).toEqual(['ExpoModulesJSI']);
  });
});

describe('generatePackageMetadataFile', () => {
  it('does not declare duplicate targets when the scheme name matches a bundled module', async () => {
    // Fake project: a precompiled pod named exactly like the brownfield scheme.
    const podDir = path.join(tmpDir, 'ios', 'Pods', 'TestKit');
    fs.mkdirSync(path.join(podDir, 'TestKit.xcframework'), { recursive: true });
    fs.mkdirSync(path.join(podDir, 'artifacts'), { recursive: true });
    fs.writeFileSync(path.join(podDir, 'artifacts', 'TestKit-release.tar.gz'), '');
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const config = makeConfig({
      scheme: 'TestKit',
      usePrebuilds: true,
      output: { packageName: 'TestPackage-release' },
    });
    await iosUtils.generatePackageMetadataFile(config, tmpDir);

    const manifest = fs.readFileSync(path.join(tmpDir, 'Package.swift'), 'utf8');
    const targetDeclarations = manifest.match(/name: "TestKit"/g) ?? [];
    expect(targetDeclarations).toHaveLength(1);
  });
});

describe('validateSchemeCollision', () => {
  it('fails when the scheme name collides with a bundled framework name', () => {
    const podDir = path.join(tmpDir, 'ios', 'Pods', 'ExpoBrownfield');
    fs.mkdirSync(path.join(podDir, 'ExpoBrownfield.xcframework'), { recursive: true });
    fs.mkdirSync(path.join(podDir, 'artifacts'), { recursive: true });
    fs.writeFileSync(path.join(podDir, 'artifacts', 'ExpoBrownfield-release.tar.gz'), '');
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);

    jest.spyOn(console, 'error').mockImplementation(() => {});
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    const config = makeConfig({ scheme: 'ExpoBrownfield', usePrebuilds: true });
    expect(() => (iosUtils as any).validateSchemeCollision(config)).toThrow('process.exit');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('passes for a unique scheme name', () => {
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    const config = makeConfig({ scheme: 'MyKit' });
    expect(() => (iosUtils as any).validateSchemeCollision(config)).not.toThrow();
  });
});
