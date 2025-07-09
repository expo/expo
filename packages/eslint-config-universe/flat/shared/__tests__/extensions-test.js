const { jsExtensions, platformSubextensions, computeExpoExtensions } = require('../extensions');

it(`orders more specific platform subextensions first`, () => {
  const androidIndex = platformSubextensions.indexOf('.android');
  const iosIndex = platformSubextensions.indexOf('.ios');
  const nativeIndex = platformSubextensions.indexOf('.native');

  expect(androidIndex).toBeGreaterThanOrEqual(0);
  expect(iosIndex).toBeGreaterThanOrEqual(0);
  expect(nativeIndex).toBeGreaterThanOrEqual(0);

  expect(androidIndex).toBeLessThan(nativeIndex);
  expect(iosIndex).toBeLessThan(nativeIndex);
});

it(`orders Expo-specific extensions first`, () => {
  const extensions = computeExpoExtensions(jsExtensions, platformSubextensions);
  const jsIndex = extensions.indexOf('.js');
  const expoJsIndex = extensions.indexOf('.expo.js');

  expect(jsIndex).toBeGreaterThanOrEqual(0);
  expect(expoJsIndex).toBeGreaterThanOrEqual(0);

  expect(expoJsIndex).toBeLessThan(jsIndex);
});
