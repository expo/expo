import fs from 'fs';
import path from 'path';

import type { FingerprintSource, HashSource } from '../Fingerprint.types';
import { sortConfig, sortSources } from '../Sort';

describe(sortSources, () => {
  it(`should sort sources by type in 'file > dir > contents' order`, () => {
    const sources: HashSource[] = [
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'] },
    ];

    expect(sortSources(sources)).toEqual([
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'] },
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
    ]);
  });

  it(`should sort id or filePath when item types are the same`, () => {
    const sources: HashSource[] = [
      { type: 'file', filePath: '/app/eas.json', reasons: ['easBuild'] },
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'] },
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'contents', id: 'bar', contents: 'bartender', reasons: ['bar'] },
      { type: 'dir', filePath: '/app/android', reasons: ['bareNativeDir'] },
    ];

    expect(sortSources(sources)).toEqual([
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'file', filePath: '/app/eas.json', reasons: ['easBuild'] },
      { type: 'dir', filePath: '/app/android', reasons: ['bareNativeDir'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'] },
      { type: 'contents', id: 'bar', contents: 'bartender', reasons: ['bar'] },
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
    ]);
  });

  it(`should support both HashSource and FingerprintSource types`, () => {
    const sources: HashSource[] = [
      { type: 'contents', id: 'foo', contents: 'HelloWorld', reasons: ['foo'] },
    ];
    const fingerprintSources: FingerprintSource[] = [
      {
        type: 'contents',
        id: 'foo',
        contents: 'HelloWorld',
        reasons: ['foo'],
        hash: 'bc9faaae1e35d52f3dea9651da12cd36627b8403',
      },
    ];

    expect(sortSources(sources)).toEqual(sources);
    expect(sortSources(fingerprintSources)).toEqual(fingerprintSources);
  });

  it('should sort sources by override hash key', () => {
    const sources: HashSource[] = [
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'file', filePath: '/app/eas.json', reasons: ['easBuild'], overrideHashKey: '_first' },
      { type: 'dir', filePath: '/app/android', reasons: ['bareNativeDir'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'], overrideHashKey: '_first' },
    ];

    expect(sortSources(sources)).toEqual([
      { type: 'file', filePath: '/app/eas.json', reasons: ['easBuild'], overrideHashKey: '_first' },
      { type: 'file', filePath: '/app/app.json', reasons: ['expoConfig'] },
      { type: 'dir', filePath: '/app/ios', reasons: ['bareNativeDir'], overrideHashKey: '_first' },
      { type: 'dir', filePath: '/app/android', reasons: ['bareNativeDir'] },
    ]);
  });
});

describe(sortConfig, () => {
  it('should handle null and undefined', () => {
    expect(sortConfig(null)).toBeNull();
    expect(sortConfig(undefined)).toBeUndefined();
  });

  it('should handle primitives', () => {
    expect(sortConfig(42)).toBe(42);
    expect(sortConfig('hello')).toBe('hello');
    expect(sortConfig(true)).toBe(true);
  });

  it('should produce consistent output for equivalent objects', () => {
    const input1 = { z: 1, a: 2, m: 3 };
    const input2 = { a: 2, m: 3, z: 1 };
    const input3 = { m: 3, z: 1, a: 2 };

    const result1 = JSON.stringify(sortConfig(input1));
    const result2 = JSON.stringify(sortConfig(input2));
    const result3 = JSON.stringify(sortConfig(input3));

    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
  });

  it('should handle empty objects and arrays', () => {
    expect(sortConfig({})).toEqual({});
    expect(sortConfig([])).toEqual([]);
  });

  it('should handle arrays with null values', () => {
    expect(sortConfig([null, 'b', 'a', null])).toEqual([null, null, 'a', 'b']);
  });

  it('should sort object keys alphabetically', () => {
    const input = {
      zebra: 1,
      apple: 2,
      mango: 3,
    };

    const result = sortConfig(input);
    expect(Object.keys(result)).toEqual(['apple', 'mango', 'zebra']);
    expect(result).toEqual({
      apple: 2,
      mango: 3,
      zebra: 1,
    });
  });

  it('should recursively sort nested objects', () => {
    const input = {
      zebra: {
        nested: {
          charlie: 1,
          alpha: 2,
          bravo: 3,
        },
      },
      apple: {
        zoo: 1,
        aardvark: 2,
      },
    };

    const result = sortConfig(input);
    expect(Object.keys(result)).toEqual(['apple', 'zebra']);
    expect(Object.keys(result.zebra.nested)).toEqual(['alpha', 'bravo', 'charlie']);
    expect(Object.keys(result.apple)).toEqual(['aardvark', 'zoo']);
  });

  it('should sort arrays of primitives', () => {
    expect(sortConfig([3, 1, 2])).toEqual([1, 2, 3]);
    expect(sortConfig(['zebra', 'apple', 'mango'])).toEqual(['apple', 'mango', 'zebra']);
    expect(sortConfig([true, false, true])).toEqual([false, true, true]);
  });

  it('should sort arrays of objects by name key', () => {
    const input = [
      { name: 'zebra', value: 1 },
      { name: 'apple', value: 2 },
      { name: 'mango', value: 3 },
    ];

    const result = sortConfig(input);
    expect(result).toEqual([
      { name: 'apple', value: 2 },
      { name: 'mango', value: 3 },
      { name: 'zebra', value: 1 },
    ]);
  });

  it('should sort arrays of objects by id key if name is not present', () => {
    const input = [
      { id: 'z', value: 1 },
      { id: 'a', value: 2 },
      { id: 'm', value: 3 },
    ];

    const result = sortConfig(input);
    expect(result).toEqual([
      { id: 'a', value: 2 },
      { id: 'm', value: 3 },
      { id: 'z', value: 1 },
    ]);
  });

  it('should sort arrays of objects by key key if name and id are not present', () => {
    const input = [
      { key: 'z', value: 1 },
      { key: 'a', value: 2 },
      { key: 'm', value: 3 },
    ];

    const result = sortConfig(input);
    expect(result).toEqual([
      { key: 'a', value: 2 },
      { key: 'm', value: 3 },
      { key: 'z', value: 1 },
    ]);
  });

  it('should keep original order for arrays of objects without sortable keys', () => {
    const input = [{ value: 3 }, { value: 1 }, { value: 2 }];

    const result = sortConfig(input);
    expect(result).toEqual([{ value: 3 }, { value: 1 }, { value: 2 }]);
  });

  it('should recursively sort objects within arrays', () => {
    const input = [
      { name: 'zebra', nested: { z: 1, a: 2 } },
      { name: 'apple', nested: { m: 3, b: 4 } },
    ];

    const result = sortConfig(input);
    expect(result).toEqual([
      { name: 'apple', nested: { b: 4, m: 3 } },
      { name: 'zebra', nested: { a: 2, z: 1 } },
    ]);
  });

  it('should handle complex nested structures', () => {
    const input = {
      root: '/root/apps/demo',
      dependencies: {
        'react-native-reanimated': {
          name: 'react-native-reanimated',
          platforms: {
            ios: {
              configurations: [],
              podspecPath: '/path/to/podspec',
            },
            android: {
              sourceDir: '/path/to/android',
              buildTypes: [],
            },
          },
        },
        'react-native-other': {
          name: 'react-native-other',
          platforms: {
            ios: null,
          },
        },
      },
    };

    const result = sortConfig(input);

    // Check top-level keys are sorted
    expect(Object.keys(result)).toEqual(['dependencies', 'root']);

    // Check dependencies are sorted
    expect(Object.keys(result.dependencies)).toEqual([
      'react-native-other',
      'react-native-reanimated',
    ]);

    // Check nested platform keys are sorted
    expect(Object.keys(result.dependencies['react-native-reanimated'].platforms.ios)).toEqual([
      'configurations',
      'podspecPath',
    ]);
  });

  it('should handle the RncoreAutoLinkingFromRncCli fixture structure', () => {
    const input = {
      root: '/root/apps/demo',
      reactNativePath: '/root/node_modules/react-native',
      dependencies: {
        'react-native-reanimated': {
          root: '/root/node_modules/react-native-reanimated',
          name: 'react-native-reanimated',
          platforms: {
            ios: {
              podspecPath: '/root/node_modules/react-native-reanimated/RNReanimated.podspec',
              configurations: [],
              scriptPhases: [],
            },
            android: {
              sourceDir: '/root/node_modules/react-native-reanimated/android',
              packageImportPath: 'import com.swmansion.reanimated.ReanimatedPackage;',
              packageInstance: 'new ReanimatedPackage()',
              buildTypes: [],
              componentDescriptors: [],
            },
          },
        },
      },
      commands: [
        {
          name: 'run-ios',
          description: 'builds your app and starts it on iOS simulator',
        },
        {
          name: 'log-ios',
          description: 'starts iOS device syslog tail',
        },
      ],
    };

    const result = sortConfig(input);

    // Check top-level keys are sorted
    expect(Object.keys(result)).toEqual(['commands', 'dependencies', 'reactNativePath', 'root']);

    // Commands should be sorted by name
    expect(result.commands[0].name).toBe('log-ios');
    expect(result.commands[1].name).toBe('run-ios');

    // Each object within dependencies should have sorted keys
    const reanimated = result.dependencies['react-native-reanimated'];
    expect(Object.keys(reanimated)).toEqual(['name', 'platforms', 'root']);
  });

  it('should handle mixed arrays with nested structures', () => {
    const input = {
      items: [
        {
          name: 'b',
          options: [
            { name: 'option2', value: 2 },
            { name: 'option1', value: 1 },
          ],
        },
        {
          name: 'a',
          options: [
            { name: 'option4', value: 4 },
            { name: 'option3', value: 3 },
          ],
        },
      ],
    };

    const result = sortConfig(input);

    // Items should be sorted by name
    expect(result.items[0].name).toBe('a');
    expect(result.items[1].name).toBe('b');

    // Options within each item should also be sorted by name
    expect(result.items[0].options[0].name).toBe('option3');
    expect(result.items[0].options[1].name).toBe('option4');
    expect(result.items[1].options[0].name).toBe('option1');
    expect(result.items[1].options[1].name).toBe('option2');
  });

  [
    'ExpoAutolinkingAndroid.json',
    'ExpoAutolinkingAndroid55.json',
    'ExpoAutolinkingIos.json',
    'RncoreAutoLinkingFromRncCli.json',
  ].forEach((fixtureName) => {
    it(`snapshot - ${fixtureName}`, () => {
      const fixture = fs.readFileSync(
        path.join(__dirname, '..', 'sourcer', '__tests__', 'fixtures', fixtureName),
        'utf8'
      );
      expect(sortConfig(JSON.parse(fixture))).toMatchSnapshot();
    });
  });

  it('should sort autolinking projects by name', () => {
    const config = {
      extraDependencies: { androidMavenRepos: [], iosPods: {} },
      modules: [
        {
          packageName: 'expo',
          packageVersion: '49.0.5',
          projects: [
            {
              name: 'expo',
              sourceDir: '/app/node_modules/expo/android',
            },
          ],
          modules: [],
        },
        {
          packageName: 'expo-modules-core',
          packageVersion: '1.5.8',
          projects: [
            {
              name: 'expo-modules-core$android-annotation',
              sourceDir: '/app/node_modules/expo-modules-core/android-annotation',
            },
            {
              name: 'expo-modules-core',
              sourceDir: '/app/node_modules/expo-modules-core/android',
            },
            {
              name: 'expo-modules-core$android-annotation-processor',
              sourceDir: '/app/node_modules/expo-modules-core/android-annotation-processor',
            },
          ],
          modules: [],
        },
      ],
    };

    const result = sortConfig(config);
    expect(result.modules[1].projects[0].name).toBe('expo-modules-core');
    expect(result.modules[1].projects[1].name).toBe('expo-modules-core$android-annotation');
    expect(result.modules[1].projects[2].name).toBe(
      'expo-modules-core$android-annotation-processor'
    );
  });

  it('should handle unstable expo autolinking android config', () => {
    const fixture = fs.readFileSync(
      path.join(
        __dirname,
        '..',
        'sourcer',
        '__tests__',
        'fixtures',
        'ExpoAutolinkingAndroid55.json'
      ),
      'utf8'
    );
    const config = JSON.parse(fixture);
    const coreModule = config.modules.find((module) => module.packageName === 'expo-modules-core');
    expect(coreModule).toEqual({
      packageName: 'expo-modules-core',
      projects: [
        {
          name: 'expo-modules-core',
          sourceDir: '/app/node_modules/expo-modules-core/android',
          modules: [],
          packages: [
            'expo.modules.adapters.react.ReactAdapterPackage',
            'expo.modules.core.BasePackage',
            'expo.modules.kotlin.edgeToEdge.EdgeToEdgePackage',
          ],
        },
      ],
      plugins: [
        {
          id: 'expo-module-gradle-plugin',
          group: 'expo.modules',
          sourceDir: '/app/node_modules/expo-modules-core/expo-module-gradle-plugin',
          applyToRootProject: false,
        },
      ],
      packageVersion: '3.1.0',
    });

    const shuffledConfig = JSON.parse(JSON.stringify(config));
    const shuffledCoreModule = shuffledConfig.modules.find(
      (module) => module.packageName === 'expo-modules-core'
    );
    shuffledCoreModule.projects[0].packages = [
      'expo.modules.core.BasePackage',
      'expo.modules.kotlin.edgeToEdge.EdgeToEdgePackage',
      'expo.modules.adapters.react.ReactAdapterPackage',
    ];
    expect(config).not.toEqual(shuffledConfig);
    expect(sortConfig(config)).toEqual(sortConfig(shuffledConfig));
  });
});
