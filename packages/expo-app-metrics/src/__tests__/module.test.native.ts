/* eslint-disable @typescript-eslint/no-require-imports */
export {};

const mockRequireOptionalNativeModule = jest.fn();

jest.mock('expo', () => {
  class MockEventEmitter {
    private listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    addListener(name: string, listener: (...args: unknown[]) => void) {
      const set = this.listeners.get(name) ?? new Set();
      set.add(listener);
      this.listeners.set(name, set);
      return { remove: () => this.removeListener(name, listener) };
    }
    removeListener(name: string, listener: (...args: unknown[]) => void) {
      this.listeners.get(name)?.delete(listener);
    }
    removeAllListeners(name: string) {
      this.listeners.delete(name);
    }
    emit(name: string, ...args: unknown[]) {
      this.listeners.get(name)?.forEach((listener) => listener(...args));
    }
    listenerCount(name: string) {
      return this.listeners.get(name)?.size ?? 0;
    }
  }
  class MockNativeModule extends MockEventEmitter {}
  return {
    requireOptionalNativeModule: (...args: unknown[]) => mockRequireOptionalNativeModule(...args),
    EventEmitter: MockEventEmitter,
    NativeModule: MockNativeModule,
  };
});

beforeEach(() => {
  jest.resetModules();
  mockRequireOptionalNativeModule.mockReset();
});

function loadModule() {
  return (require('../module') as typeof import('../module')).default;
}

describe('when the native module is available', () => {
  it('exports it unchanged', () => {
    const native = { markFirstRender: jest.fn() };
    mockRequireOptionalNativeModule.mockReturnValue(native);

    expect(loadModule()).toBe(native);
    expect(mockRequireOptionalNativeModule).toHaveBeenCalledWith('ExpoAppMetrics');
  });
});

describe('when the native module is unavailable', () => {
  beforeEach(() => {
    mockRequireOptionalNativeModule.mockReturnValue(null);
  });

  it('does not throw on import', () => {
    expect(() => loadModule()).not.toThrow();
  });

  it('is a NativeModule like the real one', () => {
    const { NativeModule } = require('expo');
    expect(loadModule()).toBeInstanceOf(NativeModule);
  });

  it('turns metric, log, and error calls into no-ops', () => {
    const AppMetrics = loadModule();

    expect(() => {
      AppMetrics.markFirstRender();
      AppMetrics.markInteractive({ routeName: 'Home' });
      AppMetrics.logEvent('checkout', { attributes: { step: 1 } });
      AppMetrics.setGlobalAttributes({ tier: 'pro' });
      AppMetrics.reportError({ source: 'global', message: 'boom', isFatal: false });
    }).not.toThrow();
  });

  it('answers session queries with empty results', async () => {
    const AppMetrics = loadModule();

    await expect(AppMetrics.clearStoredEntries()).resolves.toBeUndefined();
    await expect(AppMetrics.getInactiveSessions()).resolves.toEqual([]);
    await expect(AppMetrics.getForegroundSession()).resolves.toBeNull();

    const session = AppMetrics.getMainSession();
    expect(session.type).toBe('main');
    expect(AppMetrics.getMainSession()).toBe(session);
    await expect(session.isActive()).resolves.toBe(true);
    await expect(session.getEndDate()).resolves.toBeNull();
    await expect(session.getMetrics()).resolves.toEqual([]);
    await expect(session.getLogs()).resolves.toEqual([]);
    await expect(session.addMetric({ name: 'x', value: 1 } as any)).resolves.toBeUndefined();
  });

  it('provides a network request observer that never emits', () => {
    const AppMetrics = loadModule();
    const observer = new AppMetrics.NetworkRequestObserver({ hosts: ['example.com'] });
    const listener = jest.fn();

    const subscription = observer.addListener('requestStarted', listener);
    expect(() => observer.setFilter(null)).not.toThrow();
    expect(() => observer.release()).not.toThrow();
    subscription.remove();

    expect(listener).not.toHaveBeenCalled();
  });
});
