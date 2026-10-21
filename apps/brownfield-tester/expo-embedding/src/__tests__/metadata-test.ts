import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  fromSpmConfig,
  fromSwiftPackage,
  fromPodspec,
  validateBuildDependencies,
} from '../metadata';
import { readPodspec } from '../podspec';

describe('Reading native build metadata', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'expo-metadata-test-'));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  function file(name: string, content = '') {
    mkdirSync(join(root, name, '..'), { recursive: true });
    writeFileSync(join(root, name), content);
  }
  function config() {
    return {
      products: [
        {
          name: 'Example',
          platforms: ['iOS("16.4")'],
          targets: [
            {
              name: 'ExampleObjC',
              moduleName: 'Example',
              type: 'objc',
              path: 'ios',
              pattern: '*.m',
              headerPattern: '*.h',
            },
            {
              name: 'Example',
              type: 'swift',
              path: 'ios',
              pattern: '*.swift',
              dependencies: ['ExampleObjC', 'expo-modules-core/ExpoModulesCore'],
              linkedFrameworks: ['AVFoundation'],
            },
          ],
        },
      ],
    };
  }

  it('should combine declared Swift and Objective-C sources into their shared module', () => {
    file('ios/Example.swift');
    file('ios/Helper.m');
    file('ios/Helper.h');
    file('ios/Tests/ExampleTests.swift');
    const build = fromSpmConfig(root, config());
    expect(build.targets).toHaveLength(1);
    expect(build.targets[0].files.map((path) => path.slice(root.length + 1))).toEqual([
      'ios/Example.swift',
      'ios/Helper.h',
      'ios/Helper.m',
    ]);
    expect(build.targets[0].dependencies).toEqual(['ExpoModulesCore']);
    expect(build.targets[0].frameworks).toContain('AVFoundation');
  });

  it('should preserve source exclusions and resource files', () => {
    file('ios/Example.swift');
    file('ios/Excluded.swift');
    file('ios/PrivacyInfo.xcprivacy');
    const build = fromSpmConfig(root, {
      products: [
        {
          name: 'Example',
          targets: [
            {
              name: 'Example',
              type: 'swift',
              path: 'ios',
              pattern: '*.swift',
              exclude: ['Excluded.swift'],
              resources: [{ path: 'ios/PrivacyInfo.xcprivacy', rule: 'copy' }],
            },
          ],
        },
      ],
    });
    expect(build.targets[0].files).toEqual([join(root, 'ios/Example.swift')]);
    expect(build.targets[0].resources).toEqual([join(root, 'ios/PrivacyInfo.xcprivacy')]);
  });

  it('should reject build features it cannot translate instead of dropping them', () => {
    expect(() =>
      fromSpmConfig(root, { products: [{ name: 'Example', customBuild: { script: 'build.sh' } }] })
    ).toThrow('customBuild');
    expect(() =>
      fromSpmConfig(root, {
        products: [{ name: 'Example', spmPackages: [{ url: 'https://example.com/lib' }] }],
      })
    ).toThrow('spmPackages');
  });

  it('should reject source paths outside the installed package', () => {
    expect(() =>
      fromSpmConfig(root, {
        products: [
          { name: 'Example', targets: [{ name: 'Example', type: 'swift', path: '../outside' }] },
        ],
      })
    ).toThrow('outside');
  });

  it('should translate Swift manifest sources, resources, and conditional compiler settings', () => {
    file('Sources/Example/Example.swift');
    file('Sources/Example/data.json', '{}');
    const build = fromSwiftPackage(root, {
      name: 'example',
      dependencies: [],
      products: [{ name: 'Example', targets: ['Example'], type: { library: ['automatic'] } }],
      targets: [
        {
          name: 'Example',
          type: 'regular',
          dependencies: [],
          exclude: [],
          resources: [{ path: 'data.json', rule: { copy: {} } }],
          settings: [
            {
              tool: 'swift',
              kind: { define: { _0: 'FEATURE' } },
              condition: { config: 'debug', platformNames: [] },
            },
          ],
        },
      ],
      swiftLanguageVersions: ['5'],
      platforms: [{ platformName: 'ios', version: '16.4' }],
    });
    expect(build.targets[0].files).toEqual([join(root, 'Sources/Example/Example.swift')]);
    expect(build.targets[0].resources).toEqual([join(root, 'Sources/Example/data.json')]);
    expect(build.targets[0].settings.Debug.swiftFlags).toContain('-DFEATURE');
    expect(build.targets[0].settings.Release.swiftFlags).not.toContain('-DFEATURE');
  });

  it('should reject Swift plugins and external packages', () => {
    expect(() =>
      fromSwiftPackage(root, { dependencies: [{ sourceControl: [] }], products: [], targets: [] })
    ).toThrow('dependencies');
    expect(() =>
      fromSwiftPackage(root, { products: [], targets: [{ name: 'Plugin', type: 'plugin' }] })
    ).toThrow('plugin');
  });

  it('should apply podspec iOS attributes and exclude test sources', () => {
    file('ios/Example.swift');
    file('ios/Tests/UnitTests.swift');
    const build = fromPodspec(root, join(root, 'ios'), {
      name: 'Example',
      source_files: '**/*.swift',
      exclude_files: 'Tests/**',
      dependencies: { ExpoModulesCore: [] },
      platforms: { ios: '16.4' },
      swift_version: '5.9',
      ios: { frameworks: 'AVFoundation' },
    });
    expect(build.targets[0].files).toEqual([join(root, 'ios/Example.swift')]);
    expect(build.targets[0].frameworks).toEqual(['AVFoundation']);
    expect(build.targets[0].swiftVersion).toBe('5.0');
    expect(() =>
      fromPodspec(root, root, { name: 'Example', script_phases: [{ script: 'echo build' }] })
    ).toThrow('script_phases');
  });

  it('should forward declared C flags to the Swift Clang importer', () => {
    file('ios/Example.swift');
    const build = fromSpmConfig(root, {
      products: [
        {
          name: 'Example',
          targets: [
            { name: 'Example', type: 'swift', path: 'ios', compilerFlags: ['-DFEATURE=1'] },
          ],
        },
      ],
    });
    expect(build.targets[0].settings.Debug.swiftFlags).toEqual(
      expect.arrayContaining(['-Xcc', '-DFEATURE=1'])
    );
  });

  it('should use SwiftPM default public headers and toolchain language mode', () => {
    file('Sources/Example/example.c');
    file('Sources/Example/include/example.h');
    const build = fromSwiftPackage(root, {
      name: 'Example',
      toolsVersion: { _version: '6.0.0' },
      targets: [{ name: 'Example', type: 'regular' }],
    });
    expect(build.targets[0].publicHeaders).toEqual([
      join(root, 'Sources/Example/include/example.h'),
    ]);
    expect(build.targets[0].swiftVersion).toBe('6.0');
  });

  it('should evaluate podspec metadata without loading CocoaPods', () => {
    file('ios/Example.swift');
    file(
      'ios/Example.podspec',
      `Pod::Spec.new do |s|
      s.name = 'Example'
      s.ios.deployment_target = '16.4'
      s.source_files = '*.swift'
      s.dependency 'ExpoModulesCore'
      s.test_spec('Tests') { raise 'test specs must not execute' }
    end`
    );
    const spec = readPodspec(root, join(root, 'ios/Example.podspec'));
    expect(fromPodspec(root, join(root, 'ios'), spec).targets[0].dependencies).toEqual([
      'ExpoModulesCore',
    ]);
  });

  it('should reject dependency version constraints the adapter cannot resolve', () => {
    file('ios/Example.swift');
    expect(() =>
      fromPodspec(root, root, {
        name: 'Example',
        source_files: 'ios/*.swift',
        dependencies: { AnotherLibrary: ['~> 2.0'] },
      })
    ).toThrow('version requirements');
  });

  it('should not compile source files inside copied resource directories', () => {
    file('Sources/Example/Example.swift');
    file('Sources/Example/Examples/Sample.swift');
    const build = fromSwiftPackage(root, {
      name: 'Example',
      targets: [
        { name: 'Example', type: 'regular', resources: [{ path: 'Examples', rule: { copy: {} } }] },
      ],
    });
    expect(build.targets[0].files).toEqual([join(root, 'Sources/Example/Example.swift')]);
  });

  it('should reject unresolved dependencies and cycles before Xcode generation', () => {
    file('ios/Example.swift');
    const build = fromSpmConfig(root, {
      products: [
        {
          name: 'Example',
          targets: [{ name: 'Example', type: 'swift', path: 'ios', dependencies: ['Missing'] }],
        },
      ],
    });
    expect(() => validateBuildDependencies(build.targets, ['ExpoModulesCore'])).toThrow('Missing');
    const second = { ...build.targets[0], name: 'Second', dependencies: ['Example'] };
    expect(() =>
      validateBuildDependencies([{ ...build.targets[0], dependencies: ['Second'] }, second], [])
    ).toThrow('cycle');
  });
});
