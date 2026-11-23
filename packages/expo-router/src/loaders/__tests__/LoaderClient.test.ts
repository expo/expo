import { LoaderClient } from '../LoaderClient';

describe(LoaderClient, () => {
  it('installs a replacement before aborting and skips a request replaced during abort', async () => {
    const stale = deferred<string>();
    const fromAbort = jest.fn();
    const superseded = jest.fn();
    const first = jest.fn();
    const fetcher = jest
      .fn<Promise<unknown>, [string, RequestInit]>()
      .mockImplementationOnce((_path, init) => {
        init.signal!.addEventListener('abort', () => {
          expect(client.isLoading('/p')).toBe(true);
          client.start('/p', fromAbort);
        });
        return stale.promise;
      })
      .mockResolvedValueOnce('replacement');
    const client = new LoaderClient(fetcher);
    client.start('/p', first);

    client.start('/p', superseded);
    await Promise.resolve();
    stale.resolve('stale');
    await Promise.resolve();

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(first).not.toHaveBeenCalled();
    expect(superseded).not.toHaveBeenCalled();
    expect(fromAbort).toHaveBeenCalledWith({ data: 'replacement' });
    expect(client.isLoading('/p')).toBe(false);
  });

  it('removes a request before its abort listener starts replacement work', async () => {
    const stale = deferred<string>();
    const first = jest.fn();
    const replacement = jest.fn();
    const fetcher = jest
      .fn<Promise<unknown>, [string, RequestInit]>()
      .mockImplementationOnce((_path, init) => {
        init.signal!.addEventListener('abort', () => {
          expect(client.isLoading('/p')).toBe(false);
          client.start('/p', replacement);
        });
        return stale.promise;
      })
      .mockResolvedValueOnce('fresh');
    const client = new LoaderClient(fetcher);
    client.start('/p', first);

    client.abort('/p');
    stale.resolve('stale');
    await Promise.resolve();

    expect(first).not.toHaveBeenCalled();
    expect(replacement).toHaveBeenCalledWith({ data: 'fresh' });
    expect(client.isLoading('/p')).toBe(false);
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}
