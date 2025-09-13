import { expectType } from 'tsd';

import { renderHook, renderHookOnce } from '../../testing-library/hooks';
import { useLoaderData } from '../useLoaderData';

describe(useLoaderData, () => {
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    global.window = {
      location: { origin: 'http://localhost:8081' },
    } as any;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('retrieves data from globalThis.__EXPO_ROUTER_LOADER_DATA__', () => {
    const asyncLoader = async () => ({ data: 'test' });
    global.window = {
      ...originalWindow,
    } as any;
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      index: { window: 'data' },
    };

    const { result } = renderHook(() => useLoaderData(asyncLoader), ['index'], {
      initialUrl: '/',
    });

    expect(result.current).toEqual({ window: 'data' });
  });

  it(`uses the loader function's return types`, () => {
    const asyncLoader = async () => {
      return { user: { id: 1, name: 'async user' }, timestamp: Date.now() };
    };
    global.window = {
      ...global.window,
    } as any;
    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/': { user: { id: 1, name: 'async user' }, timestamp: 123456789 },
    };

    type AsyncResult = Awaited<ReturnType<typeof asyncLoader>>;
    const result = renderHookOnce(() => useLoaderData<AsyncResult>(asyncLoader), ['index'], {
      initialUrl: '/',
    });

    expectType<{ user: { id: number; name: string }; timestamp: number }>(result);
  });
});
