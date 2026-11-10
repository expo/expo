/* eslint-disable @typescript-eslint/no-require-imports */
export {};

const mockHasUserContentPrivacyEntry = jest.fn();
let mockNative: { hasUserContentPrivacyEntry?: jest.Mock };
const mockReportFeedback = jest.fn();

jest.mock('expo', () => ({
  requireNativeModule: () => mockNative,
}));

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: { reportFeedback: mockReportFeedback },
}));

const feedback = { id: 'checkout', rating: 5 };
let warnSpy: jest.SpyInstance;
// `__DEV__` is typed as a read-only global, but Jest defines it as a writable property.
const globals = globalThis as { __DEV__?: boolean };

beforeEach(() => {
  jest.clearAllMocks();
  // The warning state lives in the module, so each test loads a fresh copy.
  jest.resetModules();
  mockNative = { hasUserContentPrivacyEntry: mockHasUserContentPrivacyEntry };
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  globals.__DEV__ = true;
});

function loadObserve() {
  // `require` returns `any`, so restore the module type.
  return require('../module').default as typeof import('../module').default;
}

describe('Observe.reportFeedback privacy manifest warning on iOS', () => {
  it('warns when the privacy manifest has no user content entry', () => {
    mockHasUserContentPrivacyEntry.mockReturnValue(false);
    loadObserve().reportFeedback(feedback);
    expect(mockReportFeedback).toHaveBeenCalledWith(feedback);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('NSPrivacyCollectedDataTypeOtherUserContent');
    expect(warnSpy.mock.calls[0][0]).toContain(
      'https://docs.expo.dev/eas/observe/feedback/#privacy-manifest-entry'
    );
  });

  it('does not warn when the privacy manifest has a user content entry', () => {
    mockHasUserContentPrivacyEntry.mockReturnValue(true);
    loadObserve().reportFeedback(feedback);
    expect(mockReportFeedback).toHaveBeenCalledWith(feedback);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn when the native binary has no privacy manifest check', () => {
    delete mockNative.hasUserContentPrivacyEntry;
    const Observe = loadObserve();
    expect(() => Observe.reportFeedback(feedback)).not.toThrow();
    expect(mockReportFeedback).toHaveBeenCalledWith(feedback);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not check or warn when the feedback is dropped', () => {
    mockHasUserContentPrivacyEntry.mockReturnValue(false);
    loadObserve().reportFeedback({ id: 'checkout' });
    expect(mockReportFeedback).not.toHaveBeenCalled();
    expect(mockHasUserContentPrivacyEntry).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('checks and warns only one time across many reports', () => {
    mockHasUserContentPrivacyEntry.mockReturnValue(false);
    const Observe = loadObserve();
    Observe.reportFeedback(feedback);
    Observe.reportFeedback(feedback);
    Observe.reportFeedback(feedback);
    expect(mockReportFeedback).toHaveBeenCalledTimes(3);
    expect(mockHasUserContentPrivacyEntry).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('does not check or warn outside development', () => {
    globals.__DEV__ = false;
    mockHasUserContentPrivacyEntry.mockReturnValue(false);
    loadObserve().reportFeedback(feedback);
    expect(mockReportFeedback).toHaveBeenCalledWith(feedback);
    expect(mockHasUserContentPrivacyEntry).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
