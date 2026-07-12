it('reads the native ExpoHead module outside Expo Go', () => {
  jest.resetModules();
  const originalExpo = (globalThis as any).expo;
  const nativeModule = {
    activities: { INDEXED_ROUTE: 'indexed-route' },
    getLaunchActivity: jest.fn(),
    createActivity: jest.fn(),
    clearActivitiesAsync: jest.fn(),
    suspendActivity: jest.fn(),
    revokeActivity: jest.fn(),
  };

  (globalThis as any).expo = {
    ...originalExpo,
    modules: {
      ...originalExpo?.modules,
      ExpoGo: undefined,
      ExpoHead: nativeModule,
    },
  };

  const { ExpoHead } = require('../ExpoHeadModule') as typeof import('../ExpoHeadModule');

  expect(ExpoHead).toBe(nativeModule);

  (globalThis as any).expo = originalExpo;
});
