import { requestAsync } from '../Fetch';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('requestAsync', () => {
  it('returns parsed JSON for successful response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ name: 'test-user' }),
      text: () => Promise.resolve('{"name":"test-user"}'),
    });

    const result = await requestAsync('https://example.com/userinfo', {
      dataType: 'json',
      method: 'GET',
    });

    expect(result).toEqual({ name: 'test-user' });
  });

  it('returns text for non-JSON successful response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: () => Promise.resolve('hello world'),
    });

    const result = await requestAsync('https://example.com/text', {
      method: 'GET',
    });

    expect(result).toBe('hello world');
  });

  it('throws descriptive error for non-2xx response with empty body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({}),
      text: () => Promise.resolve(''),
    });

    await expect(
      requestAsync('https://example.com/userinfo', {
        dataType: 'json',
        method: 'GET',
      })
    ).rejects.toThrow('Request to https://example.com/userinfo failed with status 401 (Unauthorized)');
  });

  it('throws descriptive error for non-2xx response with text body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: () => Promise.resolve('Access denied'),
    });

    await expect(
      requestAsync('https://example.com/resource', {
        dataType: 'json',
        method: 'GET',
      })
    ).rejects.toThrow('Request to https://example.com/resource failed with status 403 (Forbidden): Access denied');
  });

  it('returns parsed JSON error body for non-2xx with JSON content-type (for callers like TokenRequest)', async () => {
    const errorResponse = { error: 'invalid_token', error_description: 'Token expired' };
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      text: () => Promise.resolve(JSON.stringify(errorResponse)),
    });

    // When the error response is valid JSON, it should be returned (not thrown)
    // so callers like TokenRequest.performAsync can check for 'error' in response
    const result = await requestAsync('https://example.com/token', {
      dataType: 'json',
      method: 'POST',
    });

    expect(result).toEqual(errorResponse);
  });

  it('throws error for non-2xx with JSON content-type but empty body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      text: () => Promise.resolve(''),
    });

    await expect(
      requestAsync('https://example.com/userinfo', {
        dataType: 'json',
        method: 'GET',
      })
    ).rejects.toThrow('Request to https://example.com/userinfo failed with status 401 (Unauthorized)');
  });

  it('throws error for non-2xx with JSON content-type but malformed JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers({ 'content-type': 'application/json' }),
      text: () => Promise.resolve('not valid json'),
    });

    await expect(
      requestAsync('https://example.com/api', {
        dataType: 'json',
        method: 'GET',
      })
    ).rejects.toThrow(
      'Request to https://example.com/api failed with status 500 (Internal Server Error): not valid json'
    );
  });

  it('sets Accept header for JSON dataType', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('{}'),
    });

    await requestAsync('https://example.com/api', {
      dataType: 'json',
      method: 'GET',
    });

    const [, requestInit] = mockFetch.mock.calls[0];
    expect(requestInit.headers.Accept).toBe('application/json, text/javascript; q=0.01');
  });

  it('sends body as URL-encoded form for POST requests', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true }),
      text: () => Promise.resolve('{"success":true}'),
    });

    await requestAsync('https://example.com/token', {
      dataType: 'json',
      method: 'POST',
      body: { grant_type: 'authorization_code', code: 'abc123' },
    });

    const [, requestInit] = mockFetch.mock.calls[0];
    expect(requestInit.body).toBe('grant_type=authorization_code&code=abc123');
  });

  it('appends body as query params for GET requests', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('{}'),
    });

    await requestAsync('https://example.com/api', {
      dataType: 'json',
      method: 'GET',
      body: { key: 'value' },
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('key=value');
  });
});
