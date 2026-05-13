import { ImmutableRequest } from '../../ImmutableRequest';
import { createStaticLoader, createServerLoader } from '../helpers';

describe(createStaticLoader, () => {
  it('passes only params to the callback, ignoring request', () => {
    const fn = jest.fn((params: Record<string, string | string[]>) => ({ id: params.id }));
    const loader = createStaticLoader(fn);

    const request = new ImmutableRequest(new Request('https://example.com'));
    const params = { id: '123' };

    const result = loader(request, params);

    expect(fn).toHaveBeenCalledWith(params);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: '123' });
  });

  it('works when request is undefined (SSG context)', () => {
    const fn = jest.fn((params: Record<string, string | string[]>) => ({ id: params.id }));
    const loader = createStaticLoader(fn);

    const result = loader(undefined, { id: '456' });

    expect(fn).toHaveBeenCalledWith({ id: '456' });
    expect(result).toEqual({ id: '456' });
  });

  it('supports async callbacks', async () => {
    const loader = createStaticLoader(async (params) => {
      return { id: params.id };
    });

    const result = await loader(undefined, { id: '789' });
    expect(result).toEqual({ id: '789' });
  });
});

describe(createServerLoader, () => {
  it('passes request and params to the callback', () => {
    const fn = jest.fn(
      (
        request: InstanceType<typeof ImmutableRequest>,
        params: Record<string, string | string[]>
      ) => ({
        url: request.url,
        id: params.id,
      })
    );
    const loader = createServerLoader(fn);

    const request = new ImmutableRequest(new Request('https://example.com/test'));
    const params = { id: '123' };

    const result = loader(request, params);

    expect(fn).toHaveBeenCalledWith(request, params);
    expect(result).toEqual({ url: 'https://example.com/test', id: '123' });
  });

  it('throws when request is undefined (SSG context)', () => {
    const fn = jest.fn();
    const loader = createServerLoader(fn);

    expect(() => loader(undefined, { id: '123' })).toThrow(
      'Server loader was called without a request'
    );
    expect(fn).not.toHaveBeenCalled();
  });

  it('supports async callbacks', async () => {
    const loader = createServerLoader(async (request, _params) => {
      return { method: request.method };
    });

    const request = new ImmutableRequest(new Request('https://example.com', { method: 'POST' }));
    const result = await loader(request, {});
    expect(result).toEqual({ method: 'POST' });
  });
});
