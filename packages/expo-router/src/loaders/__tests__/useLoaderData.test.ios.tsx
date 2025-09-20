import { expectType } from 'tsd';

import { renderHook } from '../../testing-library/hooks';
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
    delete (globalThis as any).__EXPO_ROUTER_LOADER_DATA__;
  });

  it('retrieves data from globalThis.__EXPO_ROUTER_LOADER_DATA__', () => {
    const asyncLoader = async () => ({ data: 'test' });

    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { some: 'data' },
    };

    const { result } = renderHook(() => useLoaderData(asyncLoader), ['index'], {
      initialUrl: '/',
    });

    expect(result.current).toEqual({ some: 'data' });
  });

  it(`uses the loader function's return types`, () => {
    const asyncLoader = async () => {
      return { user: { id: 1, name: 'async user' }, timestamp: Date.now() };
    };

    globalThis.__EXPO_ROUTER_LOADER_DATA__ = {
      '/index': { user: { id: 1, name: 'async user' }, timestamp: 123456789 },
    };

    type AsyncResult = Awaited<ReturnType<typeof asyncLoader>>;
    const { result } = renderHook(() => useLoaderData<AsyncResult>(asyncLoader), ['index'], {
      initialUrl: '/',
    });

    expectType<{ user: { id: number; name: string }; timestamp: number }>(result.current);
  });
});
