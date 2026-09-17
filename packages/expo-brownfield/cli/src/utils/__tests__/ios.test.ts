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

/**
 * Pull the `products: [...]` entries out of a generated `Package.swift`. Only the products block
 * is scanned, so the identically-shaped `.binaryTarget` declarations below it are ignored.
 */
const parseProducts = (manifest: string): { name: string; targets: string[] }[] => {
  const block = manifest.match(/products: \[\n([\s\S]*?)\n {4}\],/)?.[1];
  if (!block) {
    return [];
  }
  const products: { name: string; targets: string[] }[] = [];
  const entry = /\.library\(\s*name: "([^"]+)",\s*targets: \[([^\]]*)\],/g;
  let match: RegExpExecArray | null;
  while ((match = entry.exec(block)) !== null) {
    products.push({
      name: match[1] ?? '',
      targets: (match[2] ?? '').split(',').map((target) => target.trim().replace(/^"|"$/g, '')),
    });
  }
  return products;
};

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

  it('emits the aggregate product when prebuilds are off', async () => {
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const config = makeConfig({
      scheme: 'MyKit',
      usePrebuilds: false,
      output: { packageName: 'MyKitArtifacts' },
    });
    await iosUtils.generatePackageMetadataFile(config, tmpDir);

    const products = parseProducts(fs.readFileSync(path.join(tmpDir, 'Package.swift'), 'utf8'));
    const aggregate = products.find(({ name }) => name === 'MyKitArtifacts');
    expect(aggregate).toBeDefined();
    // The aggregate links every binary target, so `import MyKitArtifacts` is enough.
    expect(aggregate?.targets).toEqual(expect.arrayContaining(['MyKit', 'hermesvm']));
  });

  it('keeps the per-framework products alongside the aggregate when prebuilds are off', async () => {
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const config = makeConfig({
      scheme: 'MyKit',
      usePrebuilds: false,
      output: { packageName: 'MyKitArtifacts' },
    });
    await iosUtils.generatePackageMetadataFile(config, tmpDir);

    const products = parseProducts(fs.readFileSync(path.join(tmpDir, 'Package.swift'), 'utf8'));
    // Existing consumers reference the individual frameworks — they must keep resolving.
    expect(products.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['MyKitArtifacts', 'MyKit', 'hermesvm'])
    );
    expect(products.find(({ name }) => name === 'MyKit')?.targets).toEqual(['MyKit']);
  });

  it('emits only the aggregate product when prebuilds are on', async () => {
    const podDir = path.join(tmpDir, 'ios', 'Pods', 'ExpoImage');
    fs.mkdirSync(path.join(podDir, 'ExpoImage.xcframework'), { recursive: true });
    fs.mkdirSync(path.join(podDir, 'artifacts'), { recursive: true });
    fs.writeFileSync(path.join(podDir, 'artifacts', 'ExpoImage-release.tar.gz'), '');
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const config = makeConfig({
      scheme: 'MyKit',
      usePrebuilds: true,
      output: { packageName: 'MyKitArtifacts-release' },
    });
    await iosUtils.generatePackageMetadataFile(config, tmpDir);

    const products = parseProducts(fs.readFileSync(path.join(tmpDir, 'Package.swift'), 'utf8'));
    expect(products.map(({ name }) => name)).toEqual(['MyKitArtifacts-release']);
    expect(products[0]?.targets).toEqual(expect.arrayContaining(['MyKit', 'ExpoImage']));
  });

  it('does not emit a duplicate product when a framework name matches the package name', async () => {
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // `--package MyKit` on a `MyKit` scheme: the aggregate and the per-framework product would
    // collide, and SPM rejects duplicate product names.
    const config = makeConfig({
      scheme: 'MyKit',
      usePrebuilds: false,
      output: { packageName: 'MyKit' },
    });
    await iosUtils.generatePackageMetadataFile(config, tmpDir);

    const products = parseProducts(fs.readFileSync(path.join(tmpDir, 'Package.swift'), 'utf8'));
    expect(products.filter(({ name }) => name === 'MyKit')).toHaveLength(1);
    // The surviving product is the aggregate, so it still links every target.
    expect(products.find(({ name }) => name === 'MyKit')?.targets).toEqual(
      expect.arrayContaining(['MyKit', 'hermesvm'])
    );
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
