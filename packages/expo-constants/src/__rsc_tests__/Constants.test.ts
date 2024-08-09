import Constants from 'expo-constants';

it(`reads server constants without throwing`, () => {
  expect(Constants.deviceName).toBe(undefined);
  expect(Constants.debugMode).toBe(true);
  // transform-injected constants
  expect(Constants.expoConfig).toEqual(
    expect.objectContaining({
      name: 'expo-constants',
      platforms: ['ios', 'android', 'web'],
      sdkVersion: '51.0.0',
      slug: 'expo-constants',
    })
  );
});
