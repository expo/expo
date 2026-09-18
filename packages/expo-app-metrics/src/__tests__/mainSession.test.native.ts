export {};

const mockGetMainSession = jest.fn();

jest.mock('expo', () => ({
  requireNativeModule: () => ({ getMainSession: mockGetMainSession }),
}));

beforeEach(() => {
  jest.resetModules();
  mockGetMainSession.mockReset().mockImplementation(() => ({ id: 'main', addMetric: jest.fn() }));
});

function loadModule() {
  return (require('../module') as typeof import('../module')).default;
}

it('resolves the main session lazily, on the first call', () => {
  const AppMetrics = loadModule();
  expect(mockGetMainSession).not.toHaveBeenCalled();

  AppMetrics.getMainSession();
  expect(mockGetMainSession).toHaveBeenCalledTimes(1);
});

it('returns the same session on every call', () => {
  const AppMetrics = loadModule();

  const session = AppMetrics.getMainSession();

  expect(AppMetrics.getMainSession()).toBe(session);
  expect(mockGetMainSession).toHaveBeenCalledTimes(1);
});
