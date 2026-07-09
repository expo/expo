import AppMetrics from '../module';

if (typeof window !== 'undefined') {
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await AppMetrics.clearStoredEntries();
    AppMetrics.setGlobalAttributes(null);
  });

  async function getLogs() {
    return await AppMetrics.getMainSession().getLogs();
  }

  describe('logEvent', () => {
    it('stores a record with defaults', async () => {
      AppMetrics.logEvent('checkout');
      const logs = await getLogs();
      expect(logs).toHaveLength(1);
      const log = logs[0]!;
      expect(log.name).toBe('checkout');
      expect(log.severity).toBe('info');
      expect(log.body).toBeNull();
      expect(Date.parse(log.timestamp)).not.toBeNaN();
      expect(log.timestamp).toBe(new Date(log.timestamp).toISOString());
    });

    it('stores body, severity, and attributes', async () => {
      AppMetrics.logEvent('purchase_failed', {
        body: 'card declined',
        severity: 'error',
        attributes: { sku: 'abc', amount: 12.5, retries: 2, cached: false, tags: ['a', 'b'] },
      });
      const log = (await getLogs())[0]!;
      expect(log.body).toBe('card declined');
      expect(log.severity).toBe('error');
      expect(log.attributes).toEqual({
        sku: 'abc',
        amount: 12.5,
        retries: 2,
        cached: false,
        tags: ['a', 'b'],
      });
    });

    it('defaults null severity to info', async () => {
      AppMetrics.logEvent('event', { severity: null });
      expect((await getLogs())[0]!.severity).toBe('info');
    });

    it('trims the event name', async () => {
      AppMetrics.logEvent('  padded \n');
      expect((await getLogs())[0]!.name).toBe('padded');
    });

    it('drops events with an empty name and warns', async () => {
      AppMetrics.logEvent('   ');
      expect(await getLogs()).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('drops events using the reserved expo. name prefix', async () => {
      AppMetrics.logEvent('expo.internal');
      expect(await getLogs()).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('drops events with names longer than 256 characters', async () => {
      AppMetrics.logEvent('x'.repeat(257));
      expect(await getLogs()).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('truncates bodies to 4096 characters with an ellipsis', async () => {
      AppMetrics.logEvent('event', { body: 'b'.repeat(5000) });
      const log = (await getLogs())[0]!;
      expect(log.body).toHaveLength(4096);
      expect(log.body!.endsWith('…')).toBe(true);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('injects the display name as expo.log.display_name', async () => {
      AppMetrics.logEvent('event', { displayName: '  Checkout Started  ' });
      expect((await getLogs())[0]!.attributes).toEqual({
        'expo.log.display_name': 'Checkout Started',
      });
    });

    it('omits blank display names and truncates overlong ones to 128 characters', async () => {
      AppMetrics.logEvent('one', { displayName: '   ' });
      AppMetrics.logEvent('two', { displayName: 'd'.repeat(200) });
      const logs = await getLogs();
      expect(logs[0]!.attributes).toBeNull();
      const displayName = logs[1]!.attributes!['expo.log.display_name'] as string;
      expect(displayName).toHaveLength(128);
      expect(displayName.endsWith('…')).toBe(true);
    });

    it('drops reserved and empty attribute keys and warns', async () => {
      AppMetrics.logEvent('event', {
        attributes: {
          '  ': 'empty',
          'expo.app.name': 'reserved',
          'session.id': 'reserved',
          'event.name': 'reserved',
          kept: 'yes',
        },
      });
      expect((await getLogs())[0]!.attributes).toEqual({ kept: 'yes' });
      expect(warnSpy).toHaveBeenCalled();
    });

    it('caps attributes at 128, keeping alphabetically-first keys', async () => {
      const attributes: Record<string, string> = {};
      for (let i = 0; i < 130; i++) {
        attributes[`k${String(i).padStart(3, '0')}`] = 'v';
      }
      AppMetrics.logEvent('event', { attributes });
      const kept = Object.keys((await getLogs())[0]!.attributes!);
      expect(kept).toHaveLength(128);
      expect(kept).toContain('k000');
      expect(kept).not.toContain('k128');
      expect(kept).not.toContain('k129');
      expect(warnSpy).toHaveBeenCalled();
    });

    it('stops accepting events once the queue is full', async () => {
      for (let i = 0; i < 1001; i++) {
        AppMetrics.logEvent('flood');
      }
      expect(await getLogs()).toHaveLength(1000);
    });
  });

  describe('setGlobalAttributes', () => {
    it('merges global attributes into records, with per-record attributes winning', async () => {
      AppMetrics.setGlobalAttributes({ plan: 'free', locale: 'en' });
      AppMetrics.logEvent('event', { attributes: { plan: 'pro' } });
      expect((await getLogs())[0]!.attributes).toEqual({ plan: 'pro', locale: 'en' });
    });

    it('captures global attributes at write time', async () => {
      AppMetrics.setGlobalAttributes({ plan: 'free' });
      AppMetrics.logEvent('first');
      AppMetrics.setGlobalAttributes({ plan: 'pro' });
      AppMetrics.logEvent('second');
      const logs = await getLogs();
      expect(logs[0]!.attributes).toEqual({ plan: 'free' });
      expect(logs[1]!.attributes).toEqual({ plan: 'pro' });
    });

    it('sanitizes global attributes and clears them on null', async () => {
      AppMetrics.setGlobalAttributes({ 'expo.reserved': 'dropped', kept: 'yes' });
      AppMetrics.logEvent('one');
      AppMetrics.setGlobalAttributes(null);
      AppMetrics.logEvent('two');
      const logs = await getLogs();
      expect(logs[0]!.attributes).toEqual({ kept: 'yes' });
      expect(logs[1]!.attributes).toBeNull();
    });
  });

  describe('sessions', () => {
    it('uses a stable UUID session id per page load', () => {
      const session = AppMetrics.getMainSession();
      expect(session.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(AppMetrics.getMainSession().id).toBe(session.id);
    });

    it('reports the main session as active with no metrics', async () => {
      const session = AppMetrics.getMainSession();
      expect(await session.isActive()).toBe(true);
      expect(await session.getMetrics()).toEqual([]);
    });
  });

  describe('clearStoredEntries', () => {
    it('empties stored logs', async () => {
      AppMetrics.logEvent('event');
      await AppMetrics.clearStoredEntries();
      expect(await getLogs()).toEqual([]);
    });
  });
} else {
  it('is callable in server environments', async () => {
    expect(() => AppMetrics.logEvent('server_event')).not.toThrow();
    expect(Array.isArray(await AppMetrics.getMainSession().getLogs())).toBe(true);
  });
}
