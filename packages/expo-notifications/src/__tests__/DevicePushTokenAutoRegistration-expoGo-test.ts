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

it('warns instead of throwing on import in Expo Go on Android', () => {
  const spy = jest.spyOn(console, 'warn').mockImplementation();
  expect(() => require('../DevicePushTokenAutoRegistration.fx')).not.toThrow();
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('unavailable in Expo Go on Android'));
  spy.mockRestore();
});
