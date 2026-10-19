/* eslint-disable @typescript-eslint/no-require-imports */
export {};

jest.mock('expo', () => ({
  NativeModule: class {},
  registerWebModule: (moduleClass: new () => unknown) => new moduleClass(),
}));

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: {
    logEvent: jest.fn(),
    markFirstRender: jest.fn(),
    markInteractive: jest.fn(),
    setGlobalAttributes: jest.fn(),
    reportError: jest.fn(),
  },
}));

function loadWebModule() {
  // `registerWebModule` returns the singleton instance, but its return type is the class itself,
  // so cast to the module interface to read instance members.
  return require('../module.web').default as unknown as import('../types').ObserveModule;
}

describe('web module', () => {
  it('reports clientId as null, because there is no EAS client id on web', () => {
    const Observe = loadWebModule();
    expect(Observe.clientId).toBeNull();
  });
});
