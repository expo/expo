import { vol } from 'memfs';

import ProcessSettings from '../api/ProcessSettings';
import * as UrlUtils from '../serverUrl';

jest.mock('../api/ProcessSettings');
jest.mock('fs');
jest.mock('resolve-from');
jest.mock('../../utils/ip');

afterAll(() => {
  jest.unmock('resolve-from');
  jest.unmock('fs');
});

afterAll(() => {
  vol.reset();
});

beforeEach(() => {
  delete process.env.EXPO_PACKAGER_PROXY_URL;
  delete process.env.EXPO_MANIFEST_PROXY_URL;
});

describe(UrlUtils.constructBundleQueryParams, () => {
  it(`creates a basic query string`, () => {
    expect(UrlUtils.constructBundleQueryParams({})).toBe('dev=false&hot=false');
    // Defaults to highest SDK Support
    expect(UrlUtils.constructBundleQueryParams({})).toBe('dev=false&hot=false');
    expect(UrlUtils.constructBundleQueryParams({})).toBe('dev=false&hot=false');
  });
  it(`creates a full query string`, () => {
    expect(UrlUtils.constructBundleQueryParams({ dev: true, minify: true })).toBe(
      'dev=true&hot=false&minify=true'
    );
  });
});

describe(UrlUtils.constructLogUrl, () => {
  it(`creates a basic log url`, () => {
    expect(UrlUtils.constructLogUrl()).toBe('http://100.100.1.100:80/logs');
  });
  it(`creates a localhost log url`, () => {
    expect(UrlUtils.constructLogUrl('localhost')).toBe('http://127.0.0.1:80/logs');
  });
});

describe(UrlUtils.constructUrl, () => {
  it(`creates a minimal url using the requested hostname`, () => {
    expect(UrlUtils.constructUrl(null, false, 'localhost')).toBe('exp://127.0.0.1:80');
  });
  it(`creates a minimal url`, () => {
    expect(UrlUtils.constructUrl(null, false)).toBe('exp://100.100.1.100:80');
  });
  it(`creates a manifest proxy url`, () => {
    expect(UrlUtils.constructUrl({ hostType: 'lan', lanType: 'ip' }, false)).toBe(
      'exp://100.100.1.100:80'
    );
  });
  it(`creates a redirect url`, () => {
    expect(UrlUtils.constructUrl({ urlType: 'redirect' }, false)).toBe(
      'https://exp.host/--/to-exp/exp%3A%2F%2F100.100.1.100%3A80'
    );
  });
  it(`creates a manifest proxy url`, () => {
    expect(UrlUtils.constructUrl({ hostType: 'lan', lanType: 'ip' }, false)).toBe(
      'exp://100.100.1.100:80'
    );
  });
  it(`creates a manifest proxy with a default port 443 with https`, () => {
    // This doesn't get used
    process.env.EXPO_PACKAGER_PROXY_URL = 'https://localhost';
    // This does...
    process.env.EXPO_MANIFEST_PROXY_URL = 'https://localhost';
    expect(UrlUtils.constructUrl(null, false)).toBe('exp://localhost:443');
  });

  it(`creates a manifest proxy url`, () => {
    // This doesn't get used
    process.env.EXPO_PACKAGER_PROXY_URL = 'http://localhost:9999';
    // This does...
    process.env.EXPO_MANIFEST_PROXY_URL = 'http://localhost:8081';
    expect(UrlUtils.constructUrl(null, false)).toBe('exp://localhost:8081');
  });
  it(`creates a manifest proxy url for the packager`, () => {
    // This doesn't get used
    process.env.EXPO_MANIFEST_PROXY_URL = 'http://localhost:8081';
    // This does...
    process.env.EXPO_PACKAGER_PROXY_URL = 'http://localhost:9999';
    expect(UrlUtils.constructUrl(null, true)).toBe('exp://localhost:9999');
  });
});

describe(UrlUtils.constructDeepLink, () => {
  beforeEach(() => {
    ProcessSettings.scheme = null;
  });
  it('delegates to constructDevClientUrl if using devClient flag', () => {
    ProcessSettings.scheme = 'custom-scheme';
    ProcessSettings.devClient = true;

    const result = UrlUtils.constructDeepLink();
    const expectedResult = UrlUtils.constructDevClientUrl();
    expect(result).toEqual(expectedResult);
  });

  it('delegates to createManifestUrl if not using devClient flag', () => {
    ProcessSettings.scheme = 'custom-scheme';
    ProcessSettings.devClient = false;

    const result = UrlUtils.constructDeepLink();
    const expectedResult = UrlUtils.constructUrl();
    expect(result).toEqual(expectedResult);
  });
});

describe(UrlUtils.constructDevClientUrl, () => {
  beforeEach(() => {
    ProcessSettings.scheme = null;
  });
  it(`throws an error if a scheme is not present in app.json`, () => {
    expect(() => UrlUtils.constructDevClientUrl()).toThrowErrorMatchingInlineSnapshot(
      `"No scheme specified for development client"`
    );
  });

  it(`creates an expo-dev-client compatible url if a scheme is provided`, () => {
    ProcessSettings.scheme = 'custom-scheme';
    expect(UrlUtils.constructDevClientUrl()).toEqual(
      'custom-scheme://expo-development-client/?url=http%3A%2F%2F100.100.1.100%3A80'
    );
  });
});

describe(UrlUtils.constructSourceMapUrl, () => {
  it(`creates a source map url`, () => {
    expect(UrlUtils.constructSourceMapUrl('./App.tsx')).toBe(
      'http://127.0.0.1:80/./App.tsx.map?dev=false&hot=false&minify=true'
    );
  });

  it(`creates a source map url for localhost`, () => {
    expect(UrlUtils.constructSourceMapUrl('./App.tsx', 'localhost')).toBe(
      'http://127.0.0.1:80/./App.tsx.map?dev=false&hot=false&minify=true'
    );
  });
});
