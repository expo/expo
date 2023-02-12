import { vol } from 'memfs';

import { resolveEntryPoint } from '../resolveEntryPoint';

describe(resolveEntryPoint, () => {
  beforeEach(() => {
    const packageJson = JSON.stringify(
      {
        name: 'testing123',
        version: '0.1.0',
        main: 'index.js',
      },
      null,
      2
    );

    const packageJsonAndroid = JSON.stringify(
      {
        name: 'testing123android',
        version: '0.1.0',
        main: 'index.android.js',
      },
      null,
      2
    );

    const packageJsonIos = JSON.stringify(
      {
        name: 'testing123ios',
        version: '0.1.0',
        main: 'index.ios.js',
      },
      null,
      2
    );

    const packageJsonNoMain = JSON.stringify({
      name: 'testing456',
      version: '0.2.0',
    });

    const appJson = JSON.stringify(
      {
        expo: {
          name: 'testing 123',
          version: '0.1.0',
          slug: 'testing-123',
        },
      },
      null,
      2
    );

    const appJsonWithEntry = JSON.stringify({
      expo: {
        name: 'testing567',
        version: '0.6.0',
        entryPoint: 'main.js',
      },
    });

    vol.fromJSON({
      '/exists-no-platform/package.json': packageJson,
      '/exists-no-platform/app.json': appJson,
      '/exists-no-platform/index.js': 'console.log("lol")',

      '/exists-no-platform-no-main/package.json': packageJsonNoMain,
      '/exists-no-platform-no-main/app.json': appJson,
      '/exists-no-platform-no-main/index.js': 'console.log("lol")',

      '/exists-android/package.json': packageJsonAndroid,
      '/exists-android/app.json': appJson,
      '/exists-android/index.android.js': 'console.log("lol")',

      '/exists-ios/package.json': packageJsonIos,
      '/exists-ios/app.json': appJson,
      '/exists-ios/index.ios.js': 'console.log("lol")',

      '/exists-expjson/package.json': packageJson,
      '/exists-expjson/app.json': appJsonWithEntry,
      '/exists-expjson/main.js': 'console.log("lol")',

      '/expo-app-entry/package.json': packageJsonNoMain,
      '/expo-app-entry/app.json': appJson,
      '/expo-app-entry/App.js': 'console.log("lol")',
    });
  });

  afterEach(() => vol.reset());

  it('exists-no-platform', () => {
    const entryPoint = resolveEntryPoint('/exists-no-platform');
    expect(entryPoint).toBe('index.js');
  });

  // Can't test resolving modules yet
  xit('exists-no-platform-no-main', () => {
    const entryPoint = resolveEntryPoint('/exists-no-platform-no-main');
    expect(entryPoint).toBe('index.js');
  });

  it('exists-android', () => {
    const entryPoint = resolveEntryPoint('/exists-android');
    expect(entryPoint).toBe('index.android.js');
  });

  it('exists-ios', () => {
    const entryPoint = resolveEntryPoint('/exists-ios');
    expect(entryPoint).toBe('index.ios.js');
  });

  it('exists-expjson', () => {
    expect(() => resolveEntryPoint('/exists-expjson')).toThrow();
  });

  // Can't test resolving modules yet
  xit('uses node_modules/expo/AppEntry as a last resort', () => {
    const entryPoint = resolveEntryPoint('/expo-app-entry');
    expect(entryPoint).toBe('node_modules/expo/AppEntry.js');
  });
});
