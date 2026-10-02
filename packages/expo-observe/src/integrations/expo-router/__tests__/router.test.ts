it('treats an expo-router without the performance API as not installed', () => {
  jest.doMock('expo-router', () => ({ useRoute: jest.fn() }));
  jest.isolateModules(() => {
    const { isRouterInstalled, isRouterOutdated, optionalRouter } = require('../router');
    expect(isRouterInstalled).toBe(false);
    expect(isRouterOutdated).toBe(true);
    expect(optionalRouter).toBeUndefined();
  });
});
