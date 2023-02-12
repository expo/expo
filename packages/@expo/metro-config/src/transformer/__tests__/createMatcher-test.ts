import { createKnownCommunityMatcher } from '../createMatcher';

describe(createKnownCommunityMatcher, () => {
  it(`tests known community packages`, () => {
    for (const id of [
      'node_modules/native-base/src/index.js',
      'node_modules/@react-native-community/somn/foobar.js',
      'node_modules/@react-native/polyfills/index.js',
      'node_modules/@sentry/react-native/index.js',
      'node_modules/victory-native/index.js',
    ]) {
      expect(createKnownCommunityMatcher().test(id)).toBe(true);
    }
  });
  it(`tests in monorepos`, () => {
    for (const id of [
      'custom/native-base/src/index.js',
      'node_modules/@react-native-community/foobar.js',
    ]) {
      expect(createKnownCommunityMatcher({ folders: ['node_modules', 'custom'] }).test(id)).toBe(
        true
      );
    }
  });
});
