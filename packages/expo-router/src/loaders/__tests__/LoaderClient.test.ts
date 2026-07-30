import { LoaderClient } from '../LoaderClient';

const tick = () => Promise.resolve();

describe(LoaderClient, () => {
  afterEach(() => {
    delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
  });

  describe('notify', () => {
    it('bumps the version and wakes subscribers', () => {
      const client = new LoaderClient();
      const listener = jest.fn();
      client.subscribe(listener);

      const before = client.getSnapshot();
      client.notify();

      expect(client.getSnapshot()).toBe(before + 1);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeLoader + execute', () => {
    it('fetches once and settles the result into the store', async () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'v1');
      const results: unknown[] = [];

      client.subscribeLoader('/p', (result) => results.push(result));
      client.execute('/p', fetcher);
      await tick();

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(results).toEqual([{ data: 'v1' }]);
      expect(client.suspense.get('/p')).toEqual({ data: 'v1' });
    });

    it('shares one in-flight execution between concurrent execute calls', async () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'v1');

      client.subscribeLoader('/p');
      client.execute('/p', fetcher);
      client.execute('/p', fetcher);
      await tick();

      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('does not execute on subscribe alone', () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'v1');

      client.subscribeLoader('/p');
      client.execute('/other', fetcher);

      expect(fetcher).not.toHaveBeenCalled();
    });

    it('pushes the result to every subscriber', async () => {
      const client = new LoaderClient();
      const first = jest.fn();
      const second = jest.fn();

      client.subscribeLoader('/p', first);
      client.subscribeLoader('/p', second);
      client.execute('/p', async () => 'v1');
      await tick();

      expect(first).toHaveBeenCalledWith({ data: 'v1' });
      expect(second).toHaveBeenCalledWith({ data: 'v1' });
    });

    it('wraps fetch rejections with the route path', async () => {
      const client = new LoaderClient();
      const results: any[] = [];

      client.subscribeLoader('/err', (result) => results.push(result));
      client.execute('/err', async () => {
        throw new Error('boom');
      });
      await tick();

      expect(results[0].error.message).toBe('Failed to load loader data for route: /err');
      expect(results[0].error.cause.message).toBe('boom');
      expect(client.suspense.get('/err')).toEqual({ error: results[0].error });
    });
  });

  describe('teardown', () => {
    it('tears down a disposed entry after the last unsubscribe', async () => {
      const client = new LoaderClient();
      client.suspense.set('/p', { data: 'v1' });

      const unsubscribe = client.subscribeLoader('/p');
      client.suspense.dispose('/p');
      unsubscribe();
      await tick();

      expect(client.suspense.get('/p')).toBeUndefined();
    });

    it('keeps an undisposed entry across teardown', async () => {
      const client = new LoaderClient();
      client.suspense.set('/p', { data: 'v1' });

      const unsubscribe = client.subscribeLoader('/p');
      unsubscribe();
      await tick();

      expect(client.suspense.get('/p')).toEqual({ data: 'v1' });
    });

    it('keeps the entry while another subscriber holds the source', async () => {
      const client = new LoaderClient();
      client.suspense.set('/p', { data: 'v1' });

      const first = client.subscribeLoader('/p');
      client.subscribeLoader('/p');
      client.suspense.dispose('/p');
      first();
      await tick();

      expect(client.suspense.get('/p')).toEqual({ data: 'v1' });
    });

    it('cancels the teardown when a subscriber returns within the same tick (Strict Mode safe)', async () => {
      const client = new LoaderClient();
      client.suspense.set('/p', { data: 'v1' });

      const unsubscribe = client.subscribeLoader('/p');
      client.suspense.dispose('/p');
      unsubscribe();
      client.subscribeLoader('/p');
      await tick();

      expect(client.suspense.get('/p')).toEqual({ data: 'v1' });
    });

    it('does not settle into the store after the source is torn down', async () => {
      const client = new LoaderClient();
      let resolveFetch!: (value: string) => void;

      const unsubscribe = client.subscribeLoader('/p');
      client.execute(
        '/p',
        () =>
          new Promise<string>((resolve) => {
            resolveFetch = resolve;
          })
      );
      client.suspense.dispose('/p');
      unsubscribe();
      await tick();

      resolveFetch('stale');
      await tick();

      expect(client.suspense.get('/p')).toBeUndefined();
    });
  });

  describe('invalidateAll', () => {
    it('re-executes paths with live subscribers and replaces the entry in place', async () => {
      const client = new LoaderClient();
      const fetcher = jest
        .fn<Promise<string>, [string]>()
        .mockResolvedValueOnce('v1')
        .mockResolvedValueOnce('v2');

      client.subscribeLoader('/p');
      client.execute('/p', fetcher);
      await tick();
      expect(client.suspense.get('/p')).toEqual({ data: 'v1' });

      client.invalidateAll();
      expect(client.suspense.get('/p')).toEqual({ data: 'v1' });

      await tick();
      expect(client.suspense.get('/p')).toEqual({ data: 'v2' });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('re-executes a hydration-seeded live path via its registered fetcher', async () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'post-edit');
      client.suspense.seed('/index', 'seeded');

      client.subscribeLoader('/index');
      client.registerFetcher('/index', fetcher);
      client.invalidateAll();
      await tick();

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(client.suspense.get('/index')).toEqual({ data: 'post-edit' });
    });

    it('clears entries without live subscribers', () => {
      const client = new LoaderClient();
      client.suspense.set('/p', { data: 'v1' });

      client.invalidateAll();

      expect(client.suspense.get('/p')).toBeUndefined();
    });

    it('wakes subscribers', () => {
      const client = new LoaderClient();
      const listener = jest.fn();
      client.subscribe(listener);
      const before = client.getSnapshot();

      client.invalidateAll();

      expect(client.getSnapshot()).toBe(before + 1);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear', () => {
    it('drops sources and resets the Suspense store', () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'v1');
      client.subscribeLoader('/p');
      client.suspense.set('/p', { data: 'v1' });

      client.clear();
      client.execute('/p', fetcher);

      expect(client.suspense.get('/p')).toBeUndefined();
      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  describe('consumeHydrationData', () => {
    it('lifts the server-injected value into the Suspense store and deletes the global key', () => {
      const client = new LoaderClient();
      globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': { seeded: true } };

      client.consumeHydrationData('/index');

      expect(client.suspense.get('/index')).toEqual({ data: { seeded: true } });
      expect(globalThis.__EXPO_ROUTER_LOADER_DATA__).not.toHaveProperty('/index');
    });

    it('does not replace an existing Suspense entry (set-if-absent)', () => {
      const client = new LoaderClient();
      client.suspense.set('/index', { data: 'existing' });
      globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/index': 'seed' };

      client.consumeHydrationData('/index');

      expect(client.suspense.get('/index')).toEqual({ data: 'existing' });
    });

    it('is a no-op when no hydration data exists for the path', () => {
      const client = new LoaderClient();
      globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/other': 'value' };

      client.consumeHydrationData('/index');

      expect(client.suspense.get('/index')).toBeUndefined();
      expect(globalThis.__EXPO_ROUTER_LOADER_DATA__).toHaveProperty('/other');
    });
  });
});
