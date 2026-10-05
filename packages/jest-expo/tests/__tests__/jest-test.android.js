it(`android only`, () => {
  const { Platform } = require('expo-modules-core');
  expect(Platform.OS).toBe('android');
  expect(Platform.OS).toMatchSnapshot();
});

it('resolves react-native/unstable-internals-do-not-use', () => {
  const internals = require('react-native/unstable-internals-do-not-use');
  expect(internals).toBeDefined();
  expect(typeof internals.AssetSourceResolver).toBe('function');
});
