import nock from 'nock';

import { isUrlOk, validateUrl } from '../url';

describe(validateUrl, () => {
  it(`guards against protocols`, () => {
    expect(validateUrl('http://127.0.0.1:80', { protocols: ['http'] })).toBe(true);
    expect(validateUrl('127.0.0.1:80', { requireProtocol: true })).toBe(false);
    expect(validateUrl('http://127.0.0.1:80', { protocols: ['https'] })).toBe(false);
    expect(validateUrl('http://127.0.0.1:80', {})).toBe(true);
    expect(
      validateUrl('127.0.0.1:80', { protocols: ['https', 'http'], requireProtocol: true })
    ).toBe(false);
    expect(validateUrl('https://expo.dev/', { protocols: ['https'] })).toBe(true);
    expect(validateUrl('', { protocols: ['https'] })).toBe(false);
    expect(validateUrl('hello', { protocols: ['https'] })).toBe(false);
  });
});

describe(isUrlOk, () => {
  it(`returns false when the URL returns non-200`, async () => {
    const scope = nock('http://example.com').get('/').reply(504, '');
    expect(await isUrlOk('http://example.com')).toBe(false);
    expect(scope.isDone()).toBe(true);
  });
  it(`returns true when the URL returns 200`, async () => {
    const scope = nock('http://example.com').get('/').reply(200, '');
    expect(await isUrlOk('http://example.com')).toBe(true);
    expect(scope.isDone()).toBe(true);
  });
});
