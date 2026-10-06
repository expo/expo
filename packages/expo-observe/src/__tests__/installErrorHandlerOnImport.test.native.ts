/* eslint-disable @typescript-eslint/no-require-imports */
export {};

const mockAppMetricsNative = { reportError: jest.fn() };
const mockObserveNative = { setBundleDefaults: jest.fn() };

jest.mock('expo', () => ({
  requireNativeModule: jest.fn((name: string) =>
    name === 'ExpoAppMetrics' ? mockAppMetricsNative : mockObserveNative
  ),
}));

type GlobalHandler = (error: any, isFatal?: boolean) => void;

const previousHandler = jest.fn();
let currentHandler: GlobalHandler = previousHandler;

beforeEach(() => {
  (globalThis as any).ErrorUtils = {
    getGlobalHandler: () => currentHandler,
    setGlobalHandler: (handler: GlobalHandler) => {
      currentHandler = handler;
    },
  };
});

afterEach(() => {
  delete (globalThis as any).ErrorUtils;
});

it('installs the global error handler when the package entry is imported', () => {
  require('../index');

  expect(currentHandler).not.toBe(previousHandler);
  currentHandler(new Error('boom'), true);
  expect(mockAppMetricsNative.reportError).toHaveBeenCalledWith(
    expect.objectContaining({ source: 'global', message: 'boom', isFatal: true })
  );
  expect(previousHandler).toHaveBeenCalledTimes(1);
});
