import { LoaderClient } from '../LoaderClient';
import { readLoaderData } from '../readLoaderData';

const tick = () => Promise.resolve();

describe(readLoaderData, () => {
  it('fetches once, then reuses the value across re-renders', async () => {
    const client = new LoaderClient();
    const fetcher = jest.fn(async () => 'v1');

    const pending = readLoaderData(client, '/p', fetcher);
    expect(pending).toBeInstanceOf(Promise);
    await pending;

    for (let i = 0; i < 5; i++) {
      expect(readLoaderData(client, '/p', fetcher)).toBe('v1');
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('serves the settled value to a retry render that runs a task after settling', async () => {
    const client = new LoaderClient();
    const fetcher = jest.fn(async () => 'v1');

    await readLoaderData(client, '/p', fetcher);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(readLoaderData(client, '/p', fetcher)).toBe('v1');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('fetches exactly once when Suspense replays a cache-miss mount', () => {
    const client = new LoaderClient();
    const fetcher = jest.fn(async () => 'v1');

    const first = readLoaderData(client, '/p', fetcher);
    const second = readLoaderData(client, '/p', fetcher);

    expect(first).toBeInstanceOf(Promise);
    expect(second).toBe(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('fetches again on a fresh mount after the reader unmounts', async () => {
    const client = new LoaderClient();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');

    await readLoaderData(client, '/p', fetcher);
    expect(readLoaderData(client, '/p', fetcher)).toBe('v1');

    const unsubscribe = client.subscribeLoader('/p');
    client.suspense.dispose('/p');
    unsubscribe();
    await tick();
    expect(client.suspense.get('/p')).toBeUndefined();

    const revisit = readLoaderData(client, '/p', fetcher);
    expect(revisit).toBeInstanceOf(Promise);
    await expect(revisit).resolves.toBe('v2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not refetch across a StrictMode unmount + remount within the same tick', async () => {
    const client = new LoaderClient();
    const fetcher = jest.fn(async () => 'v1');

    await readLoaderData(client, '/sm', fetcher);
    const unsubscribe = client.subscribeLoader('/sm');
    client.suspense.dispose('/sm');
    unsubscribe();
    client.subscribeLoader('/sm');
    await tick();

    expect(readLoaderData(client, '/sm', fetcher)).toBe('v1');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('throws the settled error to replayed reads without refetching, then clears it so a retry refetches', async () => {
    const client = new LoaderClient();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('recovered');

    await expect(readLoaderData(client, '/err', fetcher)).rejects.toThrow(
      'Failed to load loader data for route: /err'
    );
    expect(() => readLoaderData(client, '/err', fetcher)).toThrow(
      'Failed to load loader data for route: /err'
    );
    expect(fetcher).toHaveBeenCalledTimes(1);

    await tick();
    expect(client.suspense.get('/err')).toBeUndefined();

    const retry = readLoaderData(client, '/err', fetcher);
    expect(retry).toBeInstanceOf(Promise);
    await expect(retry).resolves.toBe('recovered');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not clear an entry that was replaced before the deferred error expiry runs', async () => {
    const client = new LoaderClient();
    const fetcher = jest.fn<Promise<string>, [string]>().mockRejectedValueOnce(new Error('boom'));

    await expect(readLoaderData(client, '/err', fetcher)).rejects.toThrow();
    expect(() => readLoaderData(client, '/err', fetcher)).toThrow();

    client.suspense.set('/err', { data: 'fresh' });
    await tick();

    expect(client.suspense.get('/err')).toEqual({ data: 'fresh' });
  });

  it('keeps a settled entry from an abandoned in-flight load for the next mount to adopt', async () => {
    const client = new LoaderClient();
    let resolveFetch!: (value: string) => void;
    const fetcher = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveFetch = resolve;
        })
    );

    const unsubscribe = client.subscribeLoader('/p');
    const abandoned = readLoaderData(client, '/p', fetcher) as Promise<string>;
    client.suspense.dispose('/p');
    unsubscribe();
    await tick();

    resolveFetch('stale');
    await expect(abandoned).resolves.toBe('stale');

    expect(readLoaderData(client, '/p', fetcher)).toBe('stale');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refreshes a live reader in place on invalidateAll without dropping the entry', async () => {
    const client = new LoaderClient();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');

    await readLoaderData(client, '/p', fetcher);
    client.subscribeLoader('/p');

    client.invalidateAll();
    expect(readLoaderData(client, '/p', fetcher)).toBe('v1');

    await tick();
    expect(readLoaderData(client, '/p', fetcher)).toBe('v2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('keeps the entry for a surviving reader when a sibling unmounts after invalidateAll', async () => {
    const client = new LoaderClient();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');

    await readLoaderData(client, '/p', fetcher);
    const siblingReader = client.subscribeLoader('/p');
    client.subscribeLoader('/p');

    client.invalidateAll();
    client.suspense.dispose('/p');
    siblingReader();
    await tick();

    expect(readLoaderData(client, '/p', fetcher)).toBe('v2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('clears an unwatched entry on invalidateAll so the next mount refetches', async () => {
    const client = new LoaderClient();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');

    await readLoaderData(client, '/p', fetcher);
    await tick();

    client.invalidateAll();

    const revisit = readLoaderData(client, '/p', fetcher);
    expect(revisit).toBeInstanceOf(Promise);
    await expect(revisit).resolves.toBe('v2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
