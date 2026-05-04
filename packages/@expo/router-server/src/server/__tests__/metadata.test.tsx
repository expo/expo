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
) {
  return new ImmutableRequest({
    url,
    method: 'GET',
    headers: new Headers(),
    signal: init.signal ?? new AbortController().signal,
    clone() {
      return this as Request;
    },
  } as Request);
}

describe(resolveMetadata, () => {
  beforeEach(() => {
    mockedCtx.mockReset();
  });

  it('passes the request and params to a route `generateMetadata()`', async () => {
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

    expect(generateMetadata).toHaveBeenCalledWith(request, { id: '123' });
    expect(result).toEqual({
      metadata: { title: 'Post 123' },
      headTags: '<title>Post 123</title>',
      headNodes: [<title key="metadata-title">Post 123</title>],
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

  it('returns null when the route module cannot be resolved', async () => {
    mockedCtx.mockResolvedValue(undefined as never);
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
});
