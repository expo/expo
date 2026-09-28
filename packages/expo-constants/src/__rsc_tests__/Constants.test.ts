import Constants from 'expo-constants';

it(`reads server constants without throwing`, () => {
  expect(Constants.deviceName).toBe(undefined);
  expect(Constants.debugMode).toBe(true);
  // transform-injected constants
  expect(Constants.expoConfig).toEqual(
    expect.objectContaining({
      name: 'expo-constants',
      // No `react-dom` in this package's own node_modules, so `web` is not detected.
      platforms: ['ios', 'android'],
      slug: 'expo-constants',
    })
  );
  expect(Constants.expoConfig?.sdkVersion).toMatch(/^\d+\.\d+\.\d+$/);
});
