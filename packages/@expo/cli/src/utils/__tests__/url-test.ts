import nock from 'nock';

import { isUrlOk, validateUrl, stripPort, stripExtension } from '../url';

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

describe(stripPort, () => {
  // Used in the manifest handler when the Expo Go app requests the given hostname to use.
  it(`removes the port from a host string`, async () => {
    expect(stripPort('localhost:8081')).toBe('localhost');
  });
  it(`removes the port from a URL string`, async () => {
    expect(stripPort('http://localhost:8081/path/to.js')).toBe('localhost');
  });
});

describe(stripExtension, () => {
  it(`removes the extension from a file path`, async () => {
    expect(stripExtension('/path/to/index.txt', 'txt')).toBe('/path/to/index');
  });
  it(`removes the extension from a URL string`, async () => {
    expect(stripExtension('http://localhost:8081/index.js', 'js')).toBe(
      'http://localhost:8081/index'
    );
  });
});
