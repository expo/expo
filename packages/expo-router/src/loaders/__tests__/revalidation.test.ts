import { LoaderRuntime, ROOT_LOADER_OWNER, retryLoaderError } from '../LoaderRuntime';

it('replaces an initial request and completes both callers with the newest result', async () => {
  let first!: (data: unknown) => void;
  let second!: (data: unknown) => void;
  const fetcher = jest
    .fn<Promise<unknown>, [string, RequestInit]>()
    .mockImplementationOnce(() => new Promise((resolve) => (first = resolve)))
    .mockImplementationOnce(() => new Promise((resolve) => (second = resolve)));
  const runtime = new LoaderRuntime(fetcher);
  const read = runtime.read(ROOT_LOADER_OWNER, '/p');
  const refresh = runtime.revalidate(ROOT_LOADER_OWNER, '/p');
  expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(true);
  expect(runtime.read(ROOT_LOADER_OWNER, '/p').ready).toBe(read.ready);
  first('stale');
  await Promise.resolve();
  expect(runtime.isRevalidating('/p')).toBe(true);
  second('fresh');
  await refresh;
  expect(read.get()).toBe('fresh');
  expect(runtime.isRevalidating('/p')).toBe(false);
});

it('keeps replaced refresh promises pending until the accepted replacement settles', async () => {
  let first!: (data: unknown) => void;
  let second!: (data: unknown) => void;
  const fetcher = jest
    .fn<Promise<unknown>, [string, RequestInit]>()
    .mockResolvedValueOnce('old')
    .mockImplementationOnce(() => new Promise((resolve) => (first = resolve)))
    .mockImplementationOnce(() => new Promise((resolve) => (second = resolve)));
  const runtime = new LoaderRuntime(fetcher);
  await runtime.read(ROOT_LOADER_OWNER, '/p').ready;
  const a = runtime.revalidate(ROOT_LOADER_OWNER, '/p');
  const completed = jest.fn();
  a.then(completed);
  const b = runtime.revalidate(ROOT_LOADER_OWNER, '/p');
  first('stale');
  await Promise.resolve();
  expect(completed).not.toHaveBeenCalled();
  expect(runtime.read(ROOT_LOADER_OWNER, '/p').get()).toBe('old');
  second('fresh');
  await Promise.all([a, b]);
  expect(completed).toHaveBeenCalledTimes(1);
  expect(runtime.read(ROOT_LOADER_OWNER, '/p').get()).toBe('fresh');
});

it('keeps an error for later readers and clears it when its boundary explicitly retries', async () => {
  let finish!: (data: unknown) => void;
  const fetcher = jest
    .fn<Promise<unknown>, [string, RequestInit]>()
    .mockRejectedValueOnce(new Error('offline'))
    .mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
  const runtime = new LoaderRuntime(fetcher);
  const read = runtime.read(ROOT_LOADER_OWNER, '/p');
  await read.ready;
  expect(() => read.get()).toThrow('Failed to load loader data for route: /p');
  await Promise.resolve();
  expect(() => runtime.read(ROOT_LOADER_OWNER, '/p').get()).toThrow(
    'Failed to load loader data for route: /p'
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
  const result = runtime.peek('/p');
  expect(result).toEqual({ error: expect.any(Error) });
  retryLoaderError(Reflect.get(result!, 'error'));
  expect(() => read.get()).toThrow();
  finish('recovered');
  await runtime.read(ROOT_LOADER_OWNER, '/p').ready;
  expect(read.get()).toBe('recovered');
});

it('resolves pending refreshes on disposal and ignores late completion', async () => {
  let finish!: (data: unknown) => void;
  const fetcher = jest.fn<Promise<unknown>, [string, RequestInit]>(
    () => new Promise((resolve) => (finish = resolve))
  );
  const runtime = new LoaderRuntime(fetcher);
  const unmount = runtime.mount();
  const completion = runtime.revalidate(ROOT_LOADER_OWNER, '/p');
  unmount();
  await completion;
  expect(fetcher.mock.calls[0]![1].signal!.aborted).toBe(true);
  finish('late');
  await Promise.resolve();
  expect(runtime.peek('/p')).toBeUndefined();
  expect(runtime.isRevalidating('/p')).toBe(false);
});

it('isolates refresh status and results between roots', async () => {
  const a = new LoaderRuntime(async () => 'a');
  const b = new LoaderRuntime(async () => 'b');
  await a.read(ROOT_LOADER_OWNER, '/p').ready;
  await b.read(ROOT_LOADER_OWNER, '/p').ready;
  const listener = jest.fn();
  b.subscribeStatus('/p', listener);
  await a.revalidate(ROOT_LOADER_OWNER, '/p');
  expect(listener).not.toHaveBeenCalled();
  expect(b.isRevalidating('/p')).toBe(false);
  expect(b.read(ROOT_LOADER_OWNER, '/p').get()).toBe('b');
});

it('does not resolve a refresh started by a settlement observer with the earlier result', async () => {
  let finish!: (data: unknown) => void;
  const fetcher = jest
    .fn<Promise<unknown>, [string, RequestInit]>()
    .mockResolvedValueOnce('old')
    .mockResolvedValueOnce('first')
    .mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
  const runtime = new LoaderRuntime(fetcher);
  await runtime.read(ROOT_LOADER_OWNER, '/p').ready;
  let next!: Promise<void>;
  const detach = runtime.attach(runtime.read(ROOT_LOADER_OWNER, '/p'), () => {
    detach();
    next = runtime.revalidate(ROOT_LOADER_OWNER, '/p');
  });
  await runtime.revalidate(ROOT_LOADER_OWNER, '/p');
  expect(runtime.isRevalidating('/p')).toBe(true);
  finish('second');
  await next;
  expect(runtime.read(ROOT_LOADER_OWNER, '/p').get()).toBe('second');
});

it('does not revive a disposed root through a saved refresh callback', async () => {
  const fetcher = jest.fn(async () => 'new');
  const runtime = new LoaderRuntime(fetcher);
  runtime.mount()();
  await Promise.resolve();
  await runtime.revalidate(ROOT_LOADER_OWNER, '/p');
  expect(fetcher).not.toHaveBeenCalled();
  expect(runtime.peek('/p')).toBeUndefined();
});

it('clears an unconsumed error before a replacement request starts', async () => {
  let finish!: (data: unknown) => void;
  const fetcher = jest
    .fn<Promise<unknown>, [string, RequestInit]>()
    .mockRejectedValueOnce(new Error('offline'))
    .mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
  const runtime = new LoaderRuntime(fetcher);
  await runtime.revalidate(ROOT_LOADER_OWNER, '/p');
  const replacement = runtime.revalidate(ROOT_LOADER_OWNER, '/p');
  const read = runtime.read(ROOT_LOADER_OWNER, '/p');
  expect(runtime.peek('/p')).toBe(read.ready);
  expect(() => read.get()).toThrow();
  finish('new');
  await replacement;
  expect(read.get()).toBe('new');
});
