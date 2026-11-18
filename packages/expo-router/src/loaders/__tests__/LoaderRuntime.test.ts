import { activeLoaderRuntimes, LoaderRuntime, ROOT_LOADER_OWNER } from '../LoaderRuntime';

afterEach(() => {
  delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
});

describe(LoaderRuntime, () => {
  it('shares one pending read and writes the result before waking its readers', async () => {
    const request = deferred<string>();
    const fetcher = jest.fn(() => request.promise);
    const runtime = new LoaderRuntime(fetcher);
    const first = runtime.read<string>('one', '/p');
    const second = runtime.read<string>('two', '/p');

    expect(first.ready).toBe(second.ready);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(() => first.get()).toThrow();
    request.resolve('value');
    await first.ready;

    expect(first.get()).toBe('value');
    expect(second.get()).toBe('value');
    expect(runtime.read('one', '/p').get()).toBe('value');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('hydrates once without overwriting a settled read', () => {
    const fetcher = jest.fn<Promise<unknown>, [string, RequestInit]>();
    const runtime = new LoaderRuntime(fetcher);
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/p': 'seed' };
    const first = runtime.read('one', '/p');
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/p': 'replacement' };

    expect(runtime.read('one', '/p').get()).toBe('seed');
    expect(first.get()).toBe('seed');
    expect(globalThis.__EXPO_ROUTER_LOADER_DATA__).not.toHaveProperty('/p');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not overwrite a pending read with late hydration', async () => {
    const request = deferred<string>();
    const runtime = new LoaderRuntime(() => request.promise);
    const read = runtime.read('one', '/p');
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/p': 'late seed' };

    expect(runtime.read('one', '/p').ready).toBe(read.ready);
    expect(runtime.peek('/p')).toBe(read.ready);
    request.resolve('fetched');
    await read.ready;
    expect(read.get()).toBe('fetched');
  });

  it('notifies an attachment when the result changed after its render', async () => {
    const request = deferred<string>();
    const runtime = new LoaderRuntime(() => request.promise);
    const read = runtime.read('one', '/p');
    request.resolve('value');
    await read.ready;
    const observer = jest.fn();

    runtime.attach(read, observer);

    expect(observer).toHaveBeenCalledTimes(1);
    expect(read.get()).toBe('value');
  });

  it('keeps claims when an observer disconnects and reattaches', async () => {
    const fetcher = jest.fn(async () => 'value');
    const runtime = new LoaderRuntime(fetcher);
    const read = runtime.read('one', '/p');
    await read.ready;
    const detach = runtime.attach(runtime.read('one', '/p'), jest.fn());

    detach();
    await Promise.resolve();
    runtime.attach(runtime.read('one', '/p'), jest.fn());

    expect(runtime.read('one', '/p').get()).toBe('value');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('publishes a refresh to every attached same-path reader', async () => {
    const fetcher = jest
      .fn<Promise<unknown>, [string, RequestInit]>()
      .mockResolvedValueOnce('one')
      .mockResolvedValueOnce('two');
    const runtime = new LoaderRuntime(fetcher);
    const read = runtime.read('one', '/p');
    await read.ready;
    const first = jest.fn();
    const second = jest.fn();
    runtime.attach(runtime.read('one', '/p'), first);
    runtime.attach(runtime.read('one', '/p'), second);

    runtime.invalidate();
    expect(runtime.read('one', '/p').get()).toBe('one');
    await Promise.resolve();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(read.get()).toBe('two');
  });

  it('refreshes a disconnected reader and catches it up on reattachment', async () => {
    const fetcher = jest
      .fn<Promise<unknown>, [string, RequestInit]>()
      .mockResolvedValueOnce('one')
      .mockResolvedValueOnce('two');
    const runtime = new LoaderRuntime(fetcher);
    await runtime.read('one', '/p').ready;
    const read = runtime.read('one', '/p');
    const observer = jest.fn();
    runtime.attach(read, observer)();
    runtime.invalidate();
    await Promise.resolve();

    expect(observer).not.toHaveBeenCalled();
    runtime.attach(read, observer);
    expect(observer).toHaveBeenCalledTimes(1);
    expect(read.get()).toBe('two');
  });

  it('restarts a pending request without changing its wakeable', async () => {
    const oldRequest = deferred<string>();
    const newRequest = deferred<string>();
    const fetcher = jest
      .fn<Promise<unknown>, [string, RequestInit]>()
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);
    const runtime = new LoaderRuntime(fetcher);
    const read = runtime.read('one', '/p');

    runtime.invalidate();
    expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(true);
    expect(runtime.read('one', '/p').ready).toBe(read.ready);
    oldRequest.resolve('stale');
    await Promise.resolve();
    expect(runtime.peek('/p')).toBe(read.ready);
    newRequest.resolve('fresh');
    await read.ready;

    expect(read.get()).toBe('fresh');
  });

  it('wraps an error with the route and allows an explicit retry', async () => {
    const cause = new Error('offline');
    const fetcher = jest
      .fn<Promise<unknown>, [string, RequestInit]>()
      .mockRejectedValueOnce(cause)
      .mockResolvedValueOnce('recovered');
    const runtime = new LoaderRuntime(fetcher);
    const read = runtime.read('one', '/p');
    await read.ready;

    expect(() => read.get()).toThrow('Failed to load loader data for route: /p');
    expect(runtime.peek('/p')).toEqual({
      error: new Error('Failed to load loader data for route: /p', { cause }),
    });
    await Promise.resolve();
    expect(runtime.peek('/p')).toBeUndefined();
    const retry = runtime.read('one', '/p');
    await retry.ready;

    expect(retry.get()).toBe('recovered');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('handles a synchronous fetcher error without an unhandled rejection', async () => {
    const runtime = new LoaderRuntime(() => {
      throw new Error('offline');
    });
    const read = runtime.read('one', '/p');
    await read.ready;

    expect(() => read.get()).toThrow('Failed to load loader data for route: /p');
  });

  it('can refresh an error after its deferred eviction', async () => {
    const fetcher = jest
      .fn<Promise<unknown>, [string, RequestInit]>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('recovered');
    const runtime = new LoaderRuntime(fetcher);
    const read = runtime.read('one', '/p');
    await read.ready;
    expect(() => read.get()).toThrow();
    await Promise.resolve();

    runtime.invalidate();
    await Promise.resolve();

    expect(runtime.read('one', '/p').get()).toBe('recovered');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('keeps speculative reads through unrelated committed state', () => {
    const fetcher = jest.fn<Promise<unknown>, [string, RequestInit]>(() => new Promise(() => {}));
    const runtime = new LoaderRuntime(fetcher);
    const read = runtime.read('candidate', '/p');
    runtime.commit({
      stale: false,
      key: 'root',
      routeKeySeq: 1,
      index: 0,
      routeNames: ['index'],
      routes: [{ key: 'index', name: 'index' }],
    });
    runtime.commit({
      stale: false,
      key: 'root',
      routeKeySeq: 1,
      index: 0,
      routeNames: ['index'],
      routes: [{ key: 'index', name: 'index', params: { changed: true } }],
    });

    expect(runtime.read('candidate', '/p').ready).toBe(read.ready);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(false);
  });

  it('cancels and wakes a removed route, and ignores a late result', async () => {
    const oldRequest = deferred<string>();
    const newRequest = deferred<string>();
    const fetcher = jest
      .fn<Promise<unknown>, [string, RequestInit]>()
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);
    const runtime = new LoaderRuntime(fetcher);
    const read = runtime.read('one', '/p');
    runtime.commit({
      stale: false,
      key: 'root',
      routeKeySeq: 1,
      index: 0,
      routeNames: ['p'],
      routes: [{ key: 'one', name: 'p' }],
    });
    runtime.commit({
      stale: false,
      key: 'root',
      routeKeySeq: 2,
      index: 0,
      routeNames: ['index'],
      routes: [{ key: 'index', name: 'index' }],
    });
    await read.ready;

    expect(runtime.peek('/p')).toBeUndefined();
    expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(true);
    const revisit = runtime.read('two', '/p');
    expect(revisit.ready).not.toBe(read.ready);
    oldRequest.resolve('stale');
    await Promise.resolve();
    expect(runtime.peek('/p')).toBe(revisit.ready);
    newRequest.resolve('fresh');
    await revisit.ready;
    expect(revisit.get()).toBe('fresh');
    expect(read.get()).toBe('fresh');
  });

  it('retains one request until every route sharing its path leaves', () => {
    const fetcher = jest.fn<Promise<unknown>, [string, RequestInit]>(() => new Promise(() => {}));
    const runtime = new LoaderRuntime(fetcher);
    runtime.read('one', '/p');
    runtime.read('two', '/p');
    runtime.commit({
      stale: false,
      key: 'root',
      routeKeySeq: 2,
      index: 1,
      routeNames: ['p'],
      routes: [
        { key: 'one', name: 'p' },
        { key: 'two', name: 'p' },
      ],
    });
    runtime.commit({
      stale: false,
      key: 'root',
      routeKeySeq: 2,
      index: 0,
      routeNames: ['p'],
      routes: [{ key: 'one', name: 'p' }],
    });
    expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(false);

    runtime.commit({
      stale: false,
      key: 'root',
      routeKeySeq: 3,
      index: 0,
      routeNames: ['index'],
      routes: [{ key: 'index', name: 'index' }],
    });
    expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(true);
  });

  it('replaces a route claim without releasing a sibling route claim', async () => {
    const fetcher = jest.fn(async (path: string) => path);
    const runtime = new LoaderRuntime(fetcher);
    await runtime.read('one', '/old').ready;
    runtime.attach(runtime.read('one', '/old'), jest.fn());
    runtime.attach(runtime.read('two', '/old'), jest.fn());
    await runtime.read('one', '/new').ready;

    runtime.attach(runtime.read('one', '/new'), jest.fn());

    expect(runtime.peek('/old')).toEqual({ data: '/old' });
    expect(runtime.peek('/new')).toEqual({ data: '/new' });
  });

  it('releases a reader previous path when its new claim attaches', async () => {
    const runtime = new LoaderRuntime(async (path) => path);
    await runtime.read('one', '/old').ready;
    runtime.attach(runtime.read('one', '/old'), jest.fn());
    await runtime.read('one', '/new').ready;

    runtime.attach(runtime.read('one', '/new'), jest.fn());

    expect(runtime.peek('/old')).toBeUndefined();
    expect(runtime.peek('/new')).toEqual({ data: '/new' });
  });

  it('does not serve a settled speculative result to a new route visit', async () => {
    const next = deferred<string>();
    const fetcher = jest
      .fn<Promise<unknown>, [string, RequestInit]>()
      .mockResolvedValueOnce('speculative')
      .mockReturnValueOnce(next.promise);
    const runtime = new LoaderRuntime(fetcher);
    const original = runtime.read('uncommitted', '/p');
    await original.ready;

    const visit = runtime.read('new visit', '/p');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(() => visit.get()).toThrow();
    expect(original.get()).toBe('speculative');
    next.resolve('fresh');
    await visit.ready;
    expect(visit.get()).toBe('fresh');
  });

  it('preserves root-owned reads until the runtime is disposed', async () => {
    const runtime = new LoaderRuntime(async () => 'root');
    const unmount = runtime.mount();
    const read = runtime.read(ROOT_LOADER_OWNER, '/p');
    await read.ready;
    runtime.attach(runtime.read(ROOT_LOADER_OWNER, '/p'), jest.fn());
    runtime.commit({
      stale: false,
      key: 'root',
      routeKeySeq: 1,
      index: 0,
      routeNames: ['index'],
      routes: [{ key: 'index', name: 'index' }],
    });

    expect(read.get()).toBe('root');
    unmount();
    await Promise.resolve();
    expect(runtime.peek('/p')).toBeUndefined();
  });

  it('survives Strict Mode root effect replay and aborts on the final unmount', async () => {
    const fetcher = jest.fn<Promise<unknown>, [string, RequestInit]>(() => new Promise(() => {}));
    const runtime = new LoaderRuntime(fetcher);
    runtime.read('one', '/p');
    runtime.mount()();
    const unmount = runtime.mount();
    await Promise.resolve();

    expect(activeLoaderRuntimes.has(runtime)).toBe(true);
    expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(false);
    unmount();
    await Promise.resolve();
    expect(activeLoaderRuntimes.has(runtime)).toBe(false);
    expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(true);
  });

  it('ignores a superseded refresh that rejects after abort', async () => {
    const old = deferred<string>();
    const fetcher = jest
      .fn<Promise<unknown>, [string, RequestInit]>()
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce('fresh');
    const runtime = new LoaderRuntime(fetcher);
    const read = runtime.read('one', '/p');
    runtime.invalidate();
    old.reject(new Error('aborted'));
    await read.ready;

    expect(read.get()).toBe('fresh');
  });

  it('rejects attaching a read from another root', () => {
    const runtime = new LoaderRuntime(() => new Promise(() => {}));
    const other = new LoaderRuntime(() => new Promise(() => {}));
    const read = runtime.read('one', '/p');

    expect(() => other.attach(read, jest.fn())).toThrow(
      'The loader read belongs to another router root. Attach it with the runtime that created it.'
    );
  });

  it('refetches an interrupted result when its route returns after committing another path', async () => {
    const fetcher = jest.fn(async (path: string) => path);
    const runtime = new LoaderRuntime(fetcher);
    await runtime.read('route', '/a').ready;
    runtime.attach(runtime.read('route', '/a'), jest.fn());
    await runtime.read('route', '/slow').ready;
    await runtime.read('route', '/b').ready;
    runtime.attach(runtime.read('route', '/b'), jest.fn());

    const revisit = runtime.read('route', '/slow');
    await revisit.ready;

    expect(fetcher.mock.calls.map(([path]) => path)).toEqual(['/a', '/slow', '/b', '/slow']);
  });

  it('releases the old path after a reader remount and parameter change', async () => {
    const runtime = new LoaderRuntime(async (path) => path);
    await runtime.read('route', '/a').ready;
    runtime.attach(runtime.read('route', '/a'), jest.fn())();
    runtime.attach(runtime.read('route', '/a'), jest.fn());
    await runtime.read('route', '/b').ready;

    runtime.attach(runtime.read('route', '/b'), jest.fn());

    expect(runtime.peek('/a')).toBeUndefined();
  });

  it('shares hydration between route owners before their first commit', () => {
    const fetcher = jest.fn<Promise<unknown>, [string, RequestInit]>(() => new Promise(() => {}));
    const runtime = new LoaderRuntime(fetcher);
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = { '/p': 'seed' };
    const first = runtime.read('one', '/p');
    const second = runtime.read('two', '/p');

    expect(fetcher).not.toHaveBeenCalled();
    expect(first.get()).toBe('seed');
    expect(second.get()).toBe('seed');
  });

  it('reconciles focused retention against the last committed navigator', async () => {
    const fetcher = jest.fn<Promise<unknown>, [string, RequestInit]>(() => new Promise(() => {}));
    const runtime = new LoaderRuntime(fetcher);
    runtime.read('one', '/one');
    runtime.read('two', '/two');
    runtime.commit({
      stale: false,
      key: 'root',
      routeKeySeq: 2,
      index: 1,
      routeNames: ['one', 'two'],
      routes: [
        { key: 'one', name: 'one' },
        { key: 'two', name: 'two' },
      ],
    });

    runtime.setRetention('root', 'focused');
    await Promise.resolve();

    expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(true);
    expect(fetcher.mock.calls[1]![1].signal!.aborted).toBe(false);
    expect(runtime.peek('/one')).toBeUndefined();
  });

  it('keeps navigator policy until its final registration is removed', async () => {
    const fetcher = jest.fn<Promise<unknown>, [string, RequestInit]>(() => new Promise(() => {}));
    const runtime = new LoaderRuntime(fetcher);
    runtime.read('one', '/one');
    runtime.commit({
      stale: false,
      key: 'root',
      routeKeySeq: 2,
      index: 0,
      routeNames: ['one', 'two'],
      routes: [
        { key: 'one', name: 'one' },
        { key: 'two', name: 'two' },
      ],
    });
    const unregister = runtime.setRetention('root', 'focused');
    runtime.setRetention('root', 'focused');
    unregister();
    await Promise.resolve();

    runtime.commit({
      stale: false,
      key: 'root',
      routeKeySeq: 2,
      index: 1,
      routeNames: ['one', 'two'],
      routes: [
        { key: 'one', name: 'one' },
        { key: 'two', name: 'two' },
      ],
    });

    expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(true);
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
