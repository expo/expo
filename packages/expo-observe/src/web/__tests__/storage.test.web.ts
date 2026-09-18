/* eslint-disable @typescript-eslint/no-require-imports */
export {};

type Storage = typeof import('../storage');

beforeEach(() => {
  jest.resetModules();
});

function loadStorage(): Storage {
  return require('../storage') as Storage;
}

function getOnlyLog(storage: Storage) {
  const logs = storage.getPendingLogs();
  expect(logs).toHaveLength(1);
  // `toHaveLength(1)` above guarantees the element exists.
  return logs[0]!;
}

// The Node jest project has no `window`, which is the server-rendering case; the Web project runs
// under jsdom, which is the browser case.
if (typeof window === 'undefined') {
  it('stores nothing on the server, where the module state is shared by every request', () => {
    const storage = loadStorage();

    storage.storeLog('checkout_started');
    storage.storeReportedError({ message: 'boom' });

    expect(storage.getPendingLogs()).toEqual([]);
  });
} else {
  it('gives each page load its own session id', () => {
    const first = loadStorage().sessionId;
    jest.resetModules();
    const second = loadStorage().sessionId;

    expect(first).toEqual(expect.any(String));
    expect(first).not.toBe(second);
  });

  describe('storeLog', () => {
    it('stores the event as a log record', () => {
      const storage = loadStorage();
      storage.storeLog('checkout_started', {
        body: 'Cart had 3 items',
        attributes: { items: 3, coupon: 'SPRING' },
        severity: 'warn',
      });

      expect(storage.getPendingLogs()).toEqual([
        {
          timestamp: expect.any(String),
          name: 'checkout_started',
          body: 'Cart had 3 items',
          attributes: { items: 3, coupon: 'SPRING' },
          severity: 'warn',
        },
      ]);
    });

    it('stamps the record with an ISO 8601 timestamp', () => {
      const storage = loadStorage();
      storage.storeLog('app_boot');

      const { timestamp } = getOnlyLog(storage);
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('defaults severity to info and leaves body and attributes null', () => {
      const storage = loadStorage();
      storage.storeLog('app_boot');

      expect(storage.getPendingLogs()).toEqual([
        {
          timestamp: expect.any(String),
          name: 'app_boot',
          body: null,
          attributes: null,
          severity: 'info',
        },
      ]);
    });

    it('records displayName as the expo.log.display_name attribute, like native', () => {
      const storage = loadStorage();
      storage.storeLog('checkout_started', { displayName: 'Checkout started' });

      expect(getOnlyLog(storage).attributes).toEqual({
        'expo.log.display_name': 'Checkout started',
      });
    });

    it('keeps records in the order they were logged', () => {
      const storage = loadStorage();
      storage.storeLog('first');
      storage.storeLog('second');

      expect(storage.getPendingLogs().map((record) => record.name)).toEqual(['first', 'second']);
    });

    it('keeps only the latest 1000 records', () => {
      const storage = loadStorage();
      for (let i = 0; i <= 1000; i++) {
        storage.storeLog(`event_${i}`);
      }

      const logs = storage.getPendingLogs();
      expect(logs).toHaveLength(1000);
      expect(logs[0]?.name).toBe('event_1');
      expect(logs[999]?.name).toBe('event_1000');
    });

    it('merges global attributes into every record, with per-event keys winning', () => {
      const storage = loadStorage();
      storage.setGlobalAttributes({ tier: 'pro', region: 'eu' });
      storage.storeLog('sync', { attributes: { region: 'us' } });

      expect(getOnlyLog(storage).attributes).toEqual({ tier: 'pro', region: 'us' });
    });

    it('applies global attributes set after a record only to later records', () => {
      const storage = loadStorage();
      storage.storeLog('before');
      storage.setGlobalAttributes({ tier: 'pro' });
      storage.storeLog('after');

      expect(storage.getPendingLogs().map((record) => record.attributes)).toEqual([
        null,
        { tier: 'pro' },
      ]);
    });

    it.each([null, undefined, {}])('clears global attributes when set to %p', (value) => {
      const storage = loadStorage();
      storage.setGlobalAttributes({ tier: 'pro' });
      storage.setGlobalAttributes(value);
      storage.storeLog('sync');

      expect(getOnlyLog(storage).attributes).toBeNull();
    });
  });

  describe('storeReportedError', () => {
    it('stores a js.exception record following the native attribute layout', () => {
      const storage = loadStorage();
      storage.storeReportedError({
        type: 'TypeError',
        message: 'x is not a function',
        stacktrace: 'TypeError: x is not a function\n    at render',
      });

      expect(storage.getPendingLogs()).toEqual([
        {
          timestamp: expect.any(String),
          name: 'js.exception',
          body: null,
          attributes: {
            'expo.error.source': 'reportedByUser',
            'expo.error.is_fatal': false,
            'exception.type': 'TypeError',
            'exception.message': 'x is not a function',
            'exception.stacktrace': 'TypeError: x is not a function\n    at render',
          },
          severity: 'error',
        },
      ]);
    });

    it('omits absent optional fields and merges global attributes', () => {
      const storage = loadStorage();
      storage.setGlobalAttributes({ tier: 'pro' });
      storage.storeReportedError({ message: 'boom' });

      expect(getOnlyLog(storage).attributes).toEqual({
        tier: 'pro',
        'expo.error.source': 'reportedByUser',
        'expo.error.is_fatal': false,
        'exception.message': 'boom',
      });
    });
  });

  describe('removeLogs', () => {
    it('removes exactly the given records and keeps the rest', () => {
      const storage = loadStorage();
      storage.storeLog('first');
      storage.storeLog('second');
      const sent = storage.getPendingLogs();
      storage.storeLog('third');

      storage.removeLogs(sent);

      expect(storage.getPendingLogs().map((record) => record.name)).toEqual(['third']);
    });

    it('returns a new array from getPendingLogs so callers cannot drop stored records', () => {
      const storage = loadStorage();
      storage.storeLog('sync');

      storage.getPendingLogs().length = 0;

      expect(storage.getPendingLogs()).toHaveLength(1);
    });
  });
}
