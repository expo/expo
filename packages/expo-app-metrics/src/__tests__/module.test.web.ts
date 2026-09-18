import AppMetrics from '../module.web';

beforeEach(async () => {
  await AppMetrics.clearStoredEntries();
  AppMetrics.setGlobalAttributes(null);
});

async function getLogs() {
  return AppMetrics.getMainSession().getLogs();
}

async function getOnlyLog() {
  const logs = await getLogs();
  expect(logs).toHaveLength(1);
  // `toHaveLength(1)` above guarantees the element exists.
  return logs[0]!;
}

// The Node jest project has no `window`, which is the server-rendering case; the Web project runs
// under jsdom, which is the browser case.
if (typeof window === 'undefined') {
  it('stores nothing on the server, where the module singleton is shared by every request', async () => {
    AppMetrics.logEvent('checkout_started');
    AppMetrics.reportError({ source: 'reportedByUser', message: 'boom', isFatal: false });

    expect(await getLogs()).toEqual([]);
  });
} else {
  describe('logEvent on web', () => {
    it('stores the event on the main session', async () => {
      AppMetrics.logEvent('checkout_started', {
        body: 'Cart had 3 items',
        attributes: { items: 3, coupon: 'SPRING' },
        severity: 'warn',
      });

      expect(await getLogs()).toEqual([
        {
          timestamp: expect.any(String),
          name: 'checkout_started',
          body: 'Cart had 3 items',
          attributes: { items: 3, coupon: 'SPRING' },
          severity: 'warn',
        },
      ]);
    });

    it('stamps the event with an ISO 8601 timestamp', async () => {
      AppMetrics.logEvent('app_boot');

      const { timestamp } = await getOnlyLog();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('defaults severity to info and leaves body and attributes null', async () => {
      AppMetrics.logEvent('app_boot');

      expect(await getLogs()).toEqual([
        {
          timestamp: expect.any(String),
          name: 'app_boot',
          body: null,
          attributes: null,
          severity: 'info',
        },
      ]);
    });

    it('records displayName as the expo.log.display_name attribute, like native', async () => {
      AppMetrics.logEvent('checkout_started', { displayName: 'Checkout started' });

      const { attributes } = await getOnlyLog();
      expect(attributes).toEqual({ 'expo.log.display_name': 'Checkout started' });
    });

    it('keeps events in the order they were logged', async () => {
      AppMetrics.logEvent('first');
      AppMetrics.logEvent('second');

      const logs = await getLogs();
      expect(logs.map((record) => record.name)).toEqual(['first', 'second']);
    });

    it('keeps only the latest 1000 records', async () => {
      for (let i = 0; i <= 1000; i++) {
        AppMetrics.logEvent(`event_${i}`);
      }

      const logs = await getLogs();
      expect(logs).toHaveLength(1000);
      expect(logs[0]?.name).toBe('event_1');
      expect(logs[999]?.name).toBe('event_1000');
    });

    it('merges global attributes into every event, with per-event keys winning', async () => {
      AppMetrics.setGlobalAttributes({ tier: 'pro', region: 'eu' });
      AppMetrics.logEvent('sync', { attributes: { region: 'us' } });

      const { attributes } = await getOnlyLog();
      expect(attributes).toEqual({ tier: 'pro', region: 'us' });
    });

    it('applies global attributes set after an event only to later events', async () => {
      AppMetrics.logEvent('before');
      AppMetrics.setGlobalAttributes({ tier: 'pro' });
      AppMetrics.logEvent('after');

      const logs = await getLogs();
      expect(logs.map((record) => record.attributes)).toEqual([null, { tier: 'pro' }]);
    });

    it.each([null, undefined, {}])('clears global attributes when set to %p', async (value) => {
      AppMetrics.setGlobalAttributes({ tier: 'pro' });
      AppMetrics.setGlobalAttributes(value);
      AppMetrics.logEvent('sync');

      const { attributes } = await getOnlyLog();
      expect(attributes).toBeNull();
    });

    it('returns a new array so callers cannot drop stored logs', async () => {
      AppMetrics.logEvent('sync');

      const logs = await getLogs();
      logs.length = 0;
      expect(await getLogs()).toHaveLength(1);
    });

    it('drops stored logs on clearStoredEntries', async () => {
      AppMetrics.logEvent('sync');
      await AppMetrics.clearStoredEntries();

      expect(await getLogs()).toEqual([]);
    });
  });

  describe('reportError on web', () => {
    it('stores a js.exception record following the native attribute layout', async () => {
      AppMetrics.reportError({
        source: 'errorBoundary',
        type: 'TypeError',
        message: 'x is not a function',
        stacktrace: 'TypeError: x is not a function\n    at render',
        componentStack: '\n    in Screen',
        isFatal: false,
      });

      expect(await getLogs()).toEqual([
        {
          timestamp: expect.any(String),
          name: 'js.exception',
          attributes: {
            'expo.error.source': 'errorBoundary',
            'expo.error.is_fatal': false,
            'exception.type': 'TypeError',
            'exception.message': 'x is not a function',
            'exception.stacktrace': 'TypeError: x is not a function\n    at render',
            'expo.error.component_stack': '\n    in Screen',
          },
          severity: 'error',
        },
      ]);
    });

    it('omits absent optional fields and logs fatal errors at fatal severity', async () => {
      AppMetrics.reportError({ source: 'global', message: 'boom', isFatal: true });

      const record = await getOnlyLog();
      expect(record.severity).toBe('fatal');
      expect(record.attributes).toEqual({
        'expo.error.source': 'global',
        'expo.error.is_fatal': true,
        'exception.message': 'boom',
      });
    });

    it('merges global attributes into the exception record', async () => {
      AppMetrics.setGlobalAttributes({ tier: 'pro' });
      AppMetrics.reportError({ source: 'reportedByUser', message: 'boom', isFatal: false });

      const { attributes } = await getOnlyLog();
      expect(attributes).toMatchObject({ tier: 'pro', 'exception.message': 'boom' });
    });
  });
}

describe('metrics on web', () => {
  it('stores no metrics', async () => {
    const session = AppMetrics.getMainSession();
    await session.addMetric({
      timestamp: new Date().toISOString(),
      category: 'navigation',
      name: 'cold_ttr',
      value: 0.2,
    });
    AppMetrics.markFirstRender();
    AppMetrics.markInteractive({ routeName: '/' });

    expect(await session.getMetrics()).toEqual([]);
  });
});
