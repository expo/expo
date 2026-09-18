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

  it('returns a copy so callers cannot mutate the stored logs', async () => {
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
