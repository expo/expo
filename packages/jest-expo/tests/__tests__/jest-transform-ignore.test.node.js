const path = require('node:path');

const jestPreset = require('../../jest-preset');

it('transforms project code', () => {
  expect(shouldTransform('/path/to/project', 'App.tsx')).toBe(true);
  expect(shouldTransform('/path/to/project', 'app/index.js')).toBe(true);
});

describe.each([
  ['normal package paths', '/path/to/project'],
  ['pnpm isolated package paths', '/path/to/project/node_modules/.pnpm/package+group@0.0.0'],
])('%s', (_name, rootDir) => {
  it('transforms expo* packages', () => {
    expect(shouldTransform(rootDir, 'node_modules/expo/src/Expo.ts')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/expo-audio/build/index.js')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/expo-router/entry.js')).toBe(true);
  });

  it('transforms @expo/* packages', () => {
    expect(shouldTransform(rootDir, 'node_modules/@expo/devtools/build/index.js')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/@expo/dom-webview/src/index.ts')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/@expo/metro-runtime/src/index.ts')).toBe(true);
  });

  it('transforms @expo-google-fonts/* packages', () => {
    expect(shouldTransform(rootDir, 'node_modules/@expo-google-fonts/inter/index.js')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/@expo-google-fonts/poppins/index.js')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/@expo-google-fonts/roboto/index.js')).toBe(true);
  });

  it('transforms react-native* packages', () => {
    expect(shouldTransform(rootDir, 'node_modules/react-native/index.js')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/react-native-svg/index.js')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/react-native-reanimated/index.js')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/react-native-worklets/index.js')).toBe(true);
  });

  it('transforms @react-native* packages', () => {
    /* eslint-disable prettier/prettier */
    expect(shouldTransform(rootDir, 'node_modules/@react-native/normalize-colors/index.flow.js')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/@react-native/js-polyfills/index.js')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/@react-native/virtualized-lists/Lists/VirtualizedList.js')).toBe(true);
  });

  it('transforms @react-navigation/* packages', () => {
    expect(shouldTransform(rootDir, 'node_modules/@react-navigation/native/lib/module/index.js')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/@react-navigation/elements/lib/module/index.js')).toBe(true);
    expect(shouldTransform(rootDir, 'node_modules/@react-navigation/devtools/lib/module/index.js')).toBe(true);
  });

  it('transforms @sentry/react-native package', () => {
    expect(shouldTransform(rootDir, 'node_modules/@sentry/react-native/dist/js/index.js')).toBe(true);
  });

  it('does not transform reanimated/plugin', () => {
    expect(shouldTransform(rootDir, 'node_modules/react-native-reanimated/plugin/index.js')).toBe(false);
  });

  it('does not transform other packages', () => {
    expect(shouldTransform(rootDir, 'node_modules/@tsd/typescript/typescript/lib/typescript.js')).toBe(false);
    expect(shouldTransform(rootDir, 'node_modules/lodash/index.js')).toBe(false);
    expect(shouldTransform(rootDir, 'node_modules/react/index.js')).toBe(false);
    expect(shouldTransform(rootDir, 'node_modules/typescript/index.js')).toBe(false);
  });
});

// See: https://github.com/jestjs/jest/blob/4e56991693da7cd4c3730dc3579a1dd1403ee630/packages/jest-transform/src/ScriptTransformer.ts#L1018
const transformIgnoreRegex = new RegExp(jestPreset.transformIgnorePatterns.join('|'));

/**
 * Check if the file paths should be transformed by Jest.
 * This follows a similar `shouldTransform` check within Jest itself.
 *
 * @see https://github.com/jestjs/jest/blob/4e56991693da7cd4c3730dc3579a1dd1403ee630/packages/jest-transform/src/ScriptTransformer.ts#L839-L844
 * @param {string} rootDir
 * @param {string} filename
 * @return {boolean}
 */
function shouldTransform(rootDir, filename) {
  return !transformIgnoreRegex.test(path.join(rootDir, filename));
}
