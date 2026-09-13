import { LoaderClient } from '../LoaderClient';
import { createLoaderContextValue } from '../LoaderContext';
import { abandonLoaderPath, scheduleAbandonLoaderPath } from '../abandonLoaderPath';
import { readLoaderData } from '../readLoaderData';

const tick = () => Promise.resolve();
const getSignal = (requestInit: RequestInit) => requestInit.signal as AbortSignal;

describe(abandonLoaderPath, () => {
  it('does nothing when the path has no store entry', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    const abort = jest.spyOn(ctx.client, 'abort');

    abandonLoaderPath(ctx, '/missing');

    expect(abort).not.toHaveBeenCalled();
  });

  it('aborts and identity-clears a pending entry without caching an abort error', async () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    let signal!: AbortSignal;
    readLoaderData(ctx, '/p', (_path, requestInit) => {
      signal = getSignal(requestInit);
      return new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason));
      });
    });

    abandonLoaderPath(ctx, '/p');
    await tick();

    expect(signal.aborted).toBe(true);
    expect(ctx.store.get('/p')).toBeUndefined();
  });

  it('cannot resurrect an entry when a fetcher ignores abort', async () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    let resolveFetch!: (value: string) => void;
    readLoaderData(
      ctx,
      '/p',
      () =>
        new Promise<string>((resolve) => {
          resolveFetch = resolve;
        })
    );

    abandonLoaderPath(ctx, '/p');
    resolveFetch('ignored-abort');
    await tick();

    expect(ctx.store.get('/p')).toBeUndefined();
  });

  it('preserves pending state while a committed reader remains', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    let signal!: AbortSignal;
    readLoaderData(ctx, '/p', (_path, requestInit) => {
      signal = getSignal(requestInit);
      return new Promise(() => {});
    });
    ctx.client.subscribeLoader('/p', undefined, { committed: true });
    const entry = ctx.store.get('/p');

    abandonLoaderPath(ctx, '/p');

    expect(signal.aborted).toBe(false);
    expect(ctx.store.get('/p')).toBe(entry);
  });

  it('does not discard settled state', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    const entry = { data: 'settled' };
    ctx.store.set('/p', entry);

    abandonLoaderPath(ctx, '/p');

    expect(ctx.store.get('/p')).toBe(entry);
  });

  it('preserves a replacement installed synchronously by an abort listener', () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    const replacement = { data: 'replacement' };
    readLoaderData(ctx, '/p', (_path, requestInit) => {
      getSignal(requestInit).addEventListener('abort', () => ctx.store.set('/p', replacement));
      return new Promise(() => {});
    });

    abandonLoaderPath(ctx, '/p');

    expect(ctx.store.get('/p')).toBe(replacement);
  });

  it('re-checks committed-reader liveness when scheduled work runs', async () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    let signal!: AbortSignal;
    readLoaderData(ctx, '/p', (_path, requestInit) => {
      signal = getSignal(requestInit);
      return new Promise(() => {});
    });

    scheduleAbandonLoaderPath(ctx, '/p');
    ctx.client.subscribeLoader('/p', undefined, { committed: true });
    await tick();

    expect(signal.aborted).toBe(false);
    expect(ctx.store.get('/p')).toBeDefined();
  });

  it('allows a same-turn lifecycle setup to cancel scheduled abandonment', async () => {
    const ctx = createLoaderContextValue(new LoaderClient());
    let signal!: AbortSignal;
    readLoaderData(ctx, '/p', (_path, requestInit) => {
      signal = getSignal(requestInit);
      return new Promise(() => {});
    });

    const cancel = scheduleAbandonLoaderPath(ctx, '/p');
    cancel();
    await tick();

    expect(signal.aborted).toBe(false);
    expect(ctx.store.get('/p')).toBeDefined();
  });
});
