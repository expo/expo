import { LoaderClient } from '../LoaderClient';

const tick = () => Promise.resolve();

describe(LoaderClient, () => {
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
    it('shares one in-flight fetch and delivers it to every subscriber before notifying', async () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'v1');
      const events: unknown[] = [];
      client.subscribeLoader('/p', (result, isCurrentSource) => {
        events.push(['first', result, isCurrentSource]);
      });
      client.subscribeLoader('/p', (result, isCurrentSource) => {
        events.push(['second', result, isCurrentSource]);
      });
      client.subscribe(() => events.push('notify'));

      client.execute('/p', fetcher);
      client.execute('/p', fetcher);
      await tick();

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(events).toEqual([
        ['first', { data: 'v1' }, true],
        ['second', { data: 'v1' }, true],
        'notify',
      ]);
    });

    it('does not execute a fetcher for a path without a source', () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'v1');

      client.execute('/p', fetcher);

      expect(fetcher).not.toHaveBeenCalled();
    });

    it('wraps fetch rejections with the route path', async () => {
      const client = new LoaderClient();
      const results: ({ data: unknown } | { error: unknown })[] = [];

      client.subscribeLoader('/err', (result) => results.push(result));
      client.execute('/err', async () => {
        throw new Error('boom');
      });
      await tick();

      const result = results[0];
      expect(result).toEqual({ error: expect.any(Error) });
      const error = (result as { error: Error }).error;
      expect(error.message).toBe('Failed to load loader data for route: /err');
      expect(error.cause).toEqual(new Error('boom'));
    });

    it('marks results from a cleared source as stale', async () => {
      const client = new LoaderClient();
      let resolveFetch!: (value: string) => void;
      const subscriber = jest.fn();

      client.subscribeLoader('/p', subscriber);
      client.execute(
        '/p',
        () =>
          new Promise<string>((resolve) => {
            resolveFetch = resolve;
          })
      );
      client.clear();
      resolveFetch('stale');
      await tick();

      expect(subscriber).toHaveBeenCalledWith({ data: 'stale' }, false);
    });
  });

  describe('teardown', () => {
    it('calls onTearDown after the last unsubscribe', async () => {
      const client = new LoaderClient();
      const onTearDown = jest.fn();
      const unsubscribe = client.subscribeLoader('/p');

      unsubscribe(onTearDown);
      expect(onTearDown).not.toHaveBeenCalled();
      await tick();

      expect(onTearDown).toHaveBeenCalledTimes(1);
    });

    it('does not call onTearDown while a sibling subscriber remains', async () => {
      const client = new LoaderClient();
      const onTearDown = jest.fn();
      const first = client.subscribeLoader('/p');
      client.subscribeLoader('/p');

      first(onTearDown);
      await tick();

      expect(onTearDown).not.toHaveBeenCalled();
    });

    it('cancels a pending onTearDown on remount and does not retain it for later teardown', async () => {
      const client = new LoaderClient();
      const cancelledOnTearDown = jest.fn();
      const laterOnTearDown = jest.fn();
      const first = client.subscribeLoader('/p');

      first(cancelledOnTearDown);
      const second = client.subscribeLoader('/p');
      await tick();

      expect(cancelledOnTearDown).not.toHaveBeenCalled();
      second(laterOnTearDown);
      await tick();

      expect(cancelledOnTearDown).not.toHaveBeenCalled();
      expect(laterOnTearDown).toHaveBeenCalledTimes(1);
    });

    it('does not let a cancelled attempt run a later teardown with the same onTearDown', async () => {
      const client = new LoaderClient();
      const events: string[] = [];
      const onTearDown = () => events.push('onTearDown');
      const first = client.subscribeLoader('/p');

      first(onTearDown);
      const second = client.subscribeLoader('/p');
      queueMicrotask(() => events.push('between'));
      second(onTearDown);
      await tick();

      expect(events).toEqual(['between', 'onTearDown']);
    });

    it('does not deliver a result after the subscriber tears down', async () => {
      const client = new LoaderClient();
      let resolveFetch!: (value: string) => void;
      const subscriber = jest.fn();

      const unsubscribe = client.subscribeLoader('/p', subscriber);
      client.execute(
        '/p',
        () =>
          new Promise<string>((resolve) => {
            resolveFetch = resolve;
          })
      );
      unsubscribe();
      await tick();

      resolveFetch('stale');
      await tick();

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('revalidate', () => {
    it('re-executes paths with live subscribers and returns their paths', async () => {
      const client = new LoaderClient();
      const fetcher = jest
        .fn<Promise<string>, [string]>()
        .mockResolvedValueOnce('v1')
        .mockResolvedValueOnce('v2');
      const results: unknown[] = [];

      client.subscribeLoader('/p', (result) => results.push(result));
      client.execute('/p', fetcher);
      await tick();

      const inactive = client.subscribeLoader('/inactive');
      const inactiveFetcher = jest.fn(async () => 'unused');
      client.registerFetcher('/inactive', inactiveFetcher);
      inactive();
      const livePaths = client.revalidate();
      await tick();

      expect(livePaths).toEqual(new Set(['/p']));
      expect(results).toEqual([{ data: 'v1' }, { data: 'v2' }]);
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(inactiveFetcher).not.toHaveBeenCalled();
    });

    it('re-executes a registered fetcher for a live hydration-seeded path', async () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'post-edit');
      const subscriber = jest.fn();

      client.subscribeLoader('/index', subscriber);
      client.registerFetcher('/index', fetcher);
      const livePaths = client.revalidate();
      await tick();

      expect(livePaths).toEqual(new Set(['/index']));
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith({ data: 'post-edit' }, true);
    });
  });

  describe('clear', () => {
    it('drops sources and registered fetchers', () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'v1');
      client.subscribeLoader('/p');
      client.registerFetcher('/p', fetcher);

      client.clear();
      client.execute('/p');

      expect(fetcher).not.toHaveBeenCalled();
    });

    it('cancels a pending onTearDown', async () => {
      const client = new LoaderClient();
      const onTearDown = jest.fn();
      const unsubscribe = client.subscribeLoader('/p');

      unsubscribe(onTearDown);
      client.clear();
      await tick();

      expect(onTearDown).not.toHaveBeenCalled();
    });
  });
});
