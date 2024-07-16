import fs from 'fs';
import { vol } from 'memfs';
import nock from 'nock';

import { getRequestBodyCacheData, getResponseInfo } from '../ResponseCache';

describe(getResponseInfo, () => {
  it('returns json serializable response info', async () => {
    const scope = nock('http://example.com')
      .get('/test')
      .reply(200, { test: true }, { 'Content-Type': 'application/json' });

    const response = await fetch('http://example.com/test');

    expect(getResponseInfo(response as any)).toEqual({
      url: expect.any(String), // This is empty for Nock responses
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
    });

    scope.done();
  });
});

describe(getRequestBodyCacheData, () => {
  beforeEach(() => vol.reset());

  it('converts undefined body', () => {
    expect(getRequestBodyCacheData(undefined)).toBeUndefined();
  });

  it('converts string body', () => {
    expect(getRequestBodyCacheData('test')).toBe('test');
  });

  it('converts URLSearchParams body', () => {
    expect(getRequestBodyCacheData(new URLSearchParams({ test: 'true' }))).toBe('test=true');
  });

  it('converts FormData body', () => {
    const formData = new FormData();
    formData.append('test', 'hello');
    expect(getRequestBodyCacheData(formData as any)).toBe('test=hello');
  });

  it('converts buffer body', () => {
    expect(getRequestBodyCacheData(Buffer.from('test'))).toBe('test');
  });

  it('converts legacy node stream', () => {
    vol.fromJSON({ '/test': 'data' });
    const stream = fs.createReadStream('/test');
    expect(getRequestBodyCacheData(stream)).toBe('/test');
  });
});
