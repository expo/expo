// Expo Go on Android ships the native server registration module, but push
// token usage throws there.
jest.mock('expo', () => {
  const expo = jest.requireActual('expo');
  return {
    ...expo,
    isRunningInExpoGo: () => true,
    Platform: { ...expo.Platform, OS: 'android' },
  };
});
jest.mock('../ServerRegistrationModule', () => ({
  __esModule: true,
  default: {
    addListener: () => {},
    removeListeners: () => {},
    getRegistrationInfoAsync: jest.fn().mockResolvedValue(null),
    setRegistrationInfoAsync: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../utils/updateDevicePushTokenAsync');
jest.mock('../getDevicePushTokenAsync');

it('does not throw on import in Expo Go on Android', () => {
  expect(() => require('../DevicePushTokenAutoRegistration.fx')).not.toThrow();
});
