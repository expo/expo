import type { ReactNavigationState } from '../../global-state/types';
import { LoaderClient } from '../LoaderClient';
import { createLoaderContextValue } from '../LoaderContext';
import { sweepLoaderRoutes, trackLoaderRoute } from '../LoaderNavigation';
import { readLoaderData } from '../readLoaderData';

const navigationState = (routes: object[]) => ({ routes }) as unknown as ReactNavigationState;
const getSignal = (requestInit: RequestInit) => requestInit.signal as AbortSignal;

describe('loader navigation coordination', () => {
  it('does nothing when the candidate has no store entry', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    const abort = jest.spyOn(ctx.client, 'abort');

    trackLoaderRoute(ctx, '/missing', 'route-1');
    sweepLoaderRoutes(ctx, navigationState([]));

    expect(abort).not.toHaveBeenCalled();
  });

  it('aborts and identity-clears a pending entry', async () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    let signal!: AbortSignal;
    const pending = readLoaderData(ctx, '/p', (_path, requestInit) => {
      const executionSignal = getSignal(requestInit);
      signal = executionSignal;
      return new Promise((_, reject) => {
        executionSignal.addEventListener('abort', () => reject(executionSignal.reason));
      });
    }) as Promise<unknown>;

    trackLoaderRoute(ctx, '/p', 'route-1');
    sweepLoaderRoutes(ctx, navigationState([]));

    expect(signal.aborted).toBe(true);
    expect(ctx.store.get('/p')).toBeUndefined();
    await expect(pending).rejects.toThrow('Failed to load loader data for route: /p');
    expect(ctx.store.get('/p')).toBeUndefined();
  });

  it('cannot resurrect an entry when a custom fetcher ignores abort', async () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    let signal!: AbortSignal;
    let resolveFetch!: (value: string) => void;
    const pending = readLoaderData(ctx, '/p', (_path, requestInit) => {
      const executionSignal = getSignal(requestInit);
      signal = executionSignal;
      return new Promise<string>((resolve) => {
        resolveFetch = resolve;
      });
    }) as Promise<string>;

    trackLoaderRoute(ctx, '/p', 'route-1');
    sweepLoaderRoutes(ctx, navigationState([]));
    resolveFetch('ignored-abort');

    expect(signal.aborted).toBe(true);
    await expect(pending).resolves.toBe('ignored-abort');
    expect(ctx.store.get('/p')).toBeUndefined();
  });

  it('preserves a settled entry with a live subscriber', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    const entry = { data: 'live' };
    ctx.store.set('/p', entry);
    ctx.client.subscribeLoader('/p');

    trackLoaderRoute(ctx, '/p', 'route-1');
    sweepLoaderRoutes(ctx, navigationState([]));

    expect(ctx.store.get('/p')).toBe(entry);
  });

  it('clears a parked settled entry', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    ctx.store.set('/p', { data: 'parked' });

    trackLoaderRoute(ctx, '/p', 'route-1');
    sweepLoaderRoutes(ctx, navigationState([]));

    expect(ctx.store.get('/p')).toBeUndefined();
  });

  it('preserves a replacement written synchronously while aborting', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    const pending = new Promise(() => {});
    const replacement = { data: 'replacement' };
    ctx.client.subscribeLoader('/p');
    ctx.client.execute('/p', (_path, requestInit) => {
      const signal = getSignal(requestInit);
      signal.addEventListener('abort', () => ctx.store.set('/p', replacement));
      return new Promise(() => {});
    });
    ctx.store.set('/p', pending);

    trackLoaderRoute(ctx, '/p', 'route-1');
    sweepLoaderRoutes(ctx, navigationState([]));

    expect(ctx.store.get('/p')).toBe(replacement);
  });

  it('preserves a settled replacement written during the liveness check', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    const replacement = { data: 'replacement' };
    ctx.store.set('/p', { data: 'old' });
    jest.spyOn(ctx.client, 'hasSubscribers').mockImplementation(() => {
      ctx.store.set('/p', replacement);
      return false;
    });

    trackLoaderRoute(ctx, '/p', 'route-1');
    sweepLoaderRoutes(ctx, navigationState([]));

    expect(ctx.store.get('/p')).toBe(replacement);
  });

  it('walks the full nested state tree rather than only the focused branch', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    const entry = { data: 'inactive-tab' };
    ctx.store.set('/p', entry);
    trackLoaderRoute(ctx, '/p', 'deep-route');

    sweepLoaderRoutes(
      ctx,
      navigationState([
        { key: 'focused-tab' },
        {
          key: 'inactive-tab',
          state: navigationState([
            {
              key: 'nested-layout',
              state: navigationState([{ key: 'deep-route' }]),
            },
          ]),
        },
      ])
    );

    expect(ctx.store.get('/p')).toBe(entry);
  });

  it('abandons an old pending path immediately when the same key changes paths', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    let signal!: AbortSignal;
    const pending = readLoaderData(ctx, '/posts/1', (_path, requestInit) => {
      const executionSignal = getSignal(requestInit);
      signal = executionSignal;
      return new Promise(() => {});
    });
    expect(pending).toBeInstanceOf(Promise);
    trackLoaderRoute(ctx, '/posts/1', 'post-route');

    trackLoaderRoute(ctx, '/posts/2', 'post-route');

    expect(signal.aborted).toBe(true);
    expect(ctx.store.get('/posts/1')).toBeUndefined();
  });

  it('removes one duplicate owner without abandoning the remaining owner', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    const entry = { data: 'shared' };
    ctx.store.set('/p', entry);
    trackLoaderRoute(ctx, '/p', 'route-1');
    trackLoaderRoute(ctx, '/p', 'route-2');

    sweepLoaderRoutes(ctx, navigationState([{ key: 'route-2' }]));
    expect(ctx.store.get('/p')).toBe(entry);

    sweepLoaderRoutes(ctx, navigationState([]));
    expect(ctx.store.get('/p')).toBeUndefined();
  });
});
