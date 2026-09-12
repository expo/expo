import { isPathLike, normalizeAutolinkingConfigForHash } from '../AutolinkingConfig';

describe('normalizeAutolinkingConfigForHash', () => {
  const roots = ['/root/apps/demo'];

  it('should convert a dependency map to a sorted array of objects', () => {
    const config = {
      'react-native-reanimated': {
        root: '../../node_modules/react-native-reanimated',
        platforms: { ios: { configurations: [] } },
      },
      expo: {
        root: '../../node_modules/expo',
        platforms: { ios: { configurations: [] } },
      },
    };

    expect(normalizeAutolinkingConfigForHash(config, { stripPaths: false, roots })).toEqual([
      {
        name: 'expo',
        root: '../../node_modules/expo',
        platforms: { ios: { configurations: [] } },
      },
      {
        name: 'react-native-reanimated',
        root: '../../node_modules/react-native-reanimated',
        platforms: { ios: { configurations: [] } },
      },
    ]);
  });

  it('should sort known arrays by their identifying field', () => {
    const config = {
      extraDependencies: [{ url: 'https://b.example/maven' }, { url: 'https://a.example/maven' }],
      coreFeatures: ['zeta', 'alpha'],
      modules: [
        {
          packageName: 'expo-modules-core',
          projects: [{ name: 'core-b' }, { name: 'core-a' }],
        },
        { packageName: 'expo' },
      ],
    };

    expect(normalizeAutolinkingConfigForHash(config, { stripPaths: false, roots })).toEqual({
      extraDependencies: [{ url: 'https://a.example/maven' }, { url: 'https://b.example/maven' }],
      coreFeatures: ['alpha', 'zeta'],
      modules: [
        { packageName: 'expo' },
        {
          packageName: 'expo-modules-core',
          projects: [{ name: 'core-a' }, { name: 'core-b' }],
        },
      ],
    });
  });

  it('should not sort scriptPhases', () => {
    const config = {
      modules: [
        {
          name: 'reanimated',
          root: '../../node_modules/reanimated',
          platforms: {
            ios: {
              scriptPhases: [{ name: 'second' }, { name: 'first' }],
            },
          },
        },
      ],
    };

    const normalized = normalizeAutolinkingConfigForHash(config, { stripPaths: false, roots }) as {
      modules: { platforms: { ios: { scriptPhases: { name: string }[] } } }[];
    };
    expect(normalized.modules[0]?.platforms.ios.scriptPhases.map((phase) => phase.name)).toEqual([
      'second',
      'first',
    ]);
  });

  it('should keep path fields when stripPaths is false', () => {
    const config = {
      expo: {
        root: '../../node_modules/expo',
        platforms: {
          ios: {
            podspecPath: '../../node_modules/expo/Expo.podspec',
            scriptPhases: [{ name: 'setup', path: './scripts/setup.sh' }],
          },
        },
      },
    };

    const normalized = normalizeAutolinkingConfigForHash(config, { stripPaths: false, roots });
    expect(JSON.stringify(normalized)).toContain('podspecPath');
    expect(JSON.stringify(normalized)).toContain('./scripts/setup.sh');
  });

  it('should drop path-like fields when stripPaths is true', () => {
    const config = {
      expo: {
        root: '../../node_modules/expo',
        platforms: {
          ios: {
            podspecPath: '../../node_modules/expo/Expo.podspec',
            configurations: ['Debug'],
            scriptPhases: [{ name: 'setup', path: './scripts/setup.sh' }],
          },
          android: {
            sourceDir: '../../node_modules/expo/android',
            packageImportPath: 'import expo.modules.ExpoModulesPackage;',
            cmakeListsPath:
              '../../node_modules/expo/android/build/generated/source/codegen/jni/CMakeLists.txt',
          },
        },
      },
    };

    expect(normalizeAutolinkingConfigForHash(config, { stripPaths: true, roots })).toEqual([
      {
        name: 'expo',
        platforms: {
          ios: {
            configurations: ['Debug'],
            scriptPhases: [{ name: 'setup' }],
          },
          android: {
            packageImportPath: 'import expo.modules.ExpoModulesPackage;',
          },
        },
      },
    ]);
  });

  it('should keep a null platform entry when a module is unlinked on one platform', () => {
    const config = {
      'react-native-navigation-bar-color': {
        root: '../../node_modules/react-native-navigation-bar-color',
        platforms: {
          ios: null,
          android: {
            sourceDir: '../../node_modules/react-native-navigation-bar-color/android',
            packageImportPath: 'import com.thebylito.navigationbarcolor.NavigationBarColorPackage;',
          },
        },
      },
    };

    expect(normalizeAutolinkingConfigForHash(config, { stripPaths: true, roots })).toEqual([
      {
        name: 'react-native-navigation-bar-color',
        platforms: {
          ios: null,
          android: {
            packageImportPath: 'import com.thebylito.navigationbarcolor.NavigationBarColorPackage;',
          },
        },
      },
    ]);
  });

  it('should keep extraDependencies urls when stripPaths is true', () => {
    const config = {
      extraDependencies: [{ url: 'https://customers.pspdfkit.com/maven/' }],
      modules: [
        {
          packageName: 'expo',
          sourceDir: 'node_modules/expo/android',
        },
      ],
    };

    expect(normalizeAutolinkingConfigForHash(config, { stripPaths: true, roots })).toEqual({
      extraDependencies: [{ url: 'https://customers.pspdfkit.com/maven/' }],
      modules: [{ packageName: 'expo' }],
    });
  });
});

describe(isPathLike, () => {
  it('should treat absolute, relative, and node_modules paths as path-like', () => {
    expect(isPathLike('/root/apps/demo/android', ['/root/apps/demo'])).toBe(true);
    expect(isPathLike('../../node_modules/expo', [])).toBe(true);
    expect(isPathLike('./scripts/setup.sh', [])).toBe(true);
    expect(isPathLike('node_modules/expo/android', [])).toBe(true);
  });

  it('should not treat package names, java imports, or https urls as path-like', () => {
    expect(isPathLike('expo', [])).toBe(false);
    expect(isPathLike('import expo.modules.ExpoModulesPackage;', [])).toBe(false);
    expect(isPathLike('https://customers.pspdfkit.com/maven/', [])).toBe(false);
    expect(isPathLike('Debug', [])).toBe(false);
  });
});
