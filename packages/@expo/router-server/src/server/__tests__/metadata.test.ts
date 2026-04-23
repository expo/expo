import { ctx } from 'expo-router/_ctx';
import { ImmutableRequest } from 'expo-server/private';

import { resolveMetadata } from '../metadata';

jest.mock('expo-router/_ctx', () => ({
  ctx: jest.fn(),
}));

const mockedCtx = jest.mocked(ctx);

function createMockRequest(
  url: string,
  init: {
    signal?: AbortSignal;
  } = {}
): Request {
  return {
    url,
    method: 'GET',
    headers: new Headers(),
    signal: init.signal ?? new AbortController().signal,
    clone() {
      return this as Request;
    },
  } as Request;
}

describe(resolveMetadata, () => {
  beforeEach(() => {
    mockedCtx.mockReset();
  });

  it('passes an ImmutableRequest and params to route generateMetadata', async () => {
    const generateMetadata = jest.fn().mockResolvedValue({ title: 'Post 123' });
    mockedCtx.mockResolvedValue({
      generateMetadata,
    } as never);

    const request = createMockRequest('http://localhost/posts/123');
    const result = await resolveMetadata({
      route: {
        file: './posts/[id].tsx',
        page: '/posts/[id]',
      },
      request,
      params: { id: '123' },
    });

    expect(generateMetadata).toHaveBeenCalledWith(expect.any(ImmutableRequest), { id: '123' });
    expect(result).toEqual({
      metadata: { title: 'Post 123' },
      headTags: '<title>Post 123</title>',
    });
  });

  it('normalizes nullish metadata results to null', async () => {
    mockedCtx.mockResolvedValue({
      generateMetadata: jest.fn().mockResolvedValue(undefined),
    } as never);

    await expect(
      resolveMetadata({
        route: {
          file: './index.tsx',
          page: '/index',
        },
        request: createMockRequest('http://localhost/'),
        params: {},
      })
    ).resolves.toBeNull();
  });

  it('does not begin metadata work once the request is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      resolveMetadata({
        route: {
          file: './index.tsx',
          page: '/index',
        },
        request: createMockRequest('http://localhost/', { signal: controller.signal }),
        params: {},
      })
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(mockedCtx).not.toHaveBeenCalled();
  });

  it('stops waiting for metadata once the request aborts', async () => {
    const controller = new AbortController();
    mockedCtx.mockResolvedValue({
      generateMetadata: jest.fn(
        () =>
          new Promise(() => {
            // Intentionally unresolved
          })
      ),
    } as never);

    const promise = resolveMetadata({
      route: {
        file: './index.tsx',
        page: '/index',
      },
      request: createMockRequest('http://localhost/', { signal: controller.signal }),
      params: {},
    });

    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
