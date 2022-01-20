import { vol } from 'memfs';

import * as UrlUtils from '../serverUrl';

jest.mock('fs');
jest.mock('resolve-from');

jest.mock('../ip', () => ({
  address() {
    return '100.100.1.100';
  },
}));

jest.mock('@expo/image-utils', () => ({
  generateImageAsync(input, { src }) {
    const fs = require('fs');
    return { source: fs.readFileSync(src) };
  },
}));

afterAll(() => {
  jest.unmock('resolve-from');
  jest.unmock('fs');
});

const projectRoot = '/app';
const detachedProjectRoot = '/detached';
const detachedWithSchemesProjectRoot = '/detached-with-schemes';
const devClientWithSchemesProjectRoot = '/dev-client-with-schemes';
beforeAll(async () => {
  vol.fromJSON(
    {
      'package.json': JSON.stringify({ dependencies: { expo: '39.0.0' } }),
      'app.json': JSON.stringify({ sdkVersion: '39.0.0' }),
    },
    projectRoot
  );
  vol.fromJSON(
    {
      'package.json': JSON.stringify({ dependencies: { expo: '39.0.0' } }),
      'app.json': JSON.stringify({ sdkVersion: '39.0.0', detach: { scheme: 'detach-test' } }),
    },
    detachedProjectRoot
  );
  vol.fromJSON(
    {
      'package.json': JSON.stringify({ dependencies: { expo: '39.0.0' } }),
      'app.json': JSON.stringify({
        sdkVersion: '39.0.0',
        scheme: 'custom-scheme',
        detach: { scheme: 'detach-test' },
      }),
    },
    detachedWithSchemesProjectRoot
  );
  vol.fromJSON(
    {
      'package.json': JSON.stringify({ dependencies: { expo: '39.0.0' } }),
      'app.json': JSON.stringify({
        sdkVersion: '39.0.0',
        scheme: 'custom-scheme',
      }),
      '.expo/settings.json': JSON.stringify({
        scheme: 'custom-scheme',
        devClient: true,
      }),
    },
    devClientWithSchemesProjectRoot
  );
});

afterAll(() => {
  vol.reset();
});

beforeEach(() => {
  delete process.env.EXPO_PACKAGER_PROXY_URL;
  delete process.env.EXPO_MANIFEST_PROXY_URL;
});

describe(UrlUtils.constructBundleQueryParams, () => {
  it(`creates a basic query string`, async () => {
    expect(UrlUtils.constructBundleQueryParams({})).toBe('dev=false&hot=false');
    // Defaults to highest SDK Support
    expect(UrlUtils.constructBundleQueryParams({})).toBe('dev=false&hot=false');
    expect(UrlUtils.constructBundleQueryParams({})).toBe('dev=false&hot=false');
  });
  it(`creates a full query string`, async () => {
    expect(UrlUtils.constructBundleQueryParams({ dev: true, strict: true, minify: true })).toBe(
      'dev=true&hot=false&strict=true&minify=true'
    );
  });
});

describe(UrlUtils.constructLogUrlAsync, () => {
  it(`creates a basic log url`, async () => {
    await expect(UrlUtils.constructLogUrlAsync(projectRoot)).resolves.toBe(
      'http://100.100.1.100:80/logs'
    );
  });
  it(`creates a localhost log url`, async () => {
    await expect(UrlUtils.constructLogUrlAsync(projectRoot, 'localhost')).resolves.toBe(
      'http://127.0.0.1:80/logs'
    );
  });
});

describe(UrlUtils.constructUrlAsync, () => {
  describe('detached', () => {
    it(`creates a detached url with http scheme`, async () => {
      await expect(
        UrlUtils.constructUrlAsync(detachedProjectRoot, { urlType: 'http' }, false)
      ).resolves.toBe('http://100.100.1.100:80');
    });
    it(`creates a detached url with no-protocol scheme`, async () => {
      await expect(
        UrlUtils.constructUrlAsync(detachedProjectRoot, { urlType: 'no-protocol' }, false)
      ).resolves.toBe('100.100.1.100:80');
    });
    it(`creates a detached url`, async () => {
      await expect(UrlUtils.constructUrlAsync(detachedProjectRoot, null, false)).resolves.toBe(
        'detach-test://100.100.1.100:80'
      );
    });
    it(`creates a detached url and uses upper level scheme`, async () => {
      await expect(
        UrlUtils.constructUrlAsync(detachedWithSchemesProjectRoot, null, false)
      ).resolves.toBe('custom-scheme://100.100.1.100:80');
    });
  });

  it(`creates a minimal url using the requested hostname`, async () => {
    await expect(UrlUtils.constructUrlAsync(projectRoot, null, false, 'localhost')).resolves.toBe(
      'exp://127.0.0.1:80'
    );
  });
  it(`creates a minimal url`, async () => {
    await expect(UrlUtils.constructUrlAsync(projectRoot, null, false)).resolves.toBe(
      'exp://100.100.1.100:80'
    );
  });
  it(`creates a manifest proxy url`, async () => {
    await expect(
      UrlUtils.constructUrlAsync(projectRoot, { hostType: 'lan', lanType: 'ip' }, false)
    ).resolves.toBe('exp://100.100.1.100:80');
  });
  it(`creates a redirect url`, async () => {
    await expect(
      UrlUtils.constructUrlAsync(projectRoot, { urlType: 'redirect' }, false)
    ).resolves.toBe('https://exp.host/--/to-exp/exp%3A%2F%2F100.100.1.100%3A80');
  });
  it(`creates a manifest proxy url`, async () => {
    await expect(
      UrlUtils.constructUrlAsync(projectRoot, { hostType: 'lan', lanType: 'ip' }, false)
    ).resolves.toBe('exp://100.100.1.100:80');
  });
  it(`creates a manifest proxy with a default port 443 with https`, async () => {
    // This doesn't get used
    process.env.EXPO_PACKAGER_PROXY_URL = 'https://localhost';
    // This does...
    process.env.EXPO_MANIFEST_PROXY_URL = 'https://localhost';
    await expect(UrlUtils.constructUrlAsync(projectRoot, null, false)).resolves.toBe(
      'exp://localhost:443'
    );
  });

  it(`creates a manifest proxy url`, async () => {
    // This doesn't get used
    process.env.EXPO_PACKAGER_PROXY_URL = 'http://localhost:9999';
    // This does...
    process.env.EXPO_MANIFEST_PROXY_URL = 'http://localhost:8081';
    await expect(UrlUtils.constructUrlAsync(projectRoot, null, false)).resolves.toBe(
      'exp://localhost:8081'
    );
  });
  it(`creates a manifest proxy url for the packager`, async () => {
    // This doesn't get used
    process.env.EXPO_MANIFEST_PROXY_URL = 'http://localhost:8081';
    // This does...
    process.env.EXPO_PACKAGER_PROXY_URL = 'http://localhost:9999';
    await expect(UrlUtils.constructUrlAsync(projectRoot, null, true)).resolves.toBe(
      'exp://localhost:9999'
    );
  });
});

describe(UrlUtils.constructDeepLinkAsync, () => {
  it('delegates to constructDevClientUrlAsync if using devClient flag', async () => {
    const result = await UrlUtils.constructDeepLinkAsync(devClientWithSchemesProjectRoot);
    const expectedResult = await UrlUtils.constructDevClientUrlAsync(
      devClientWithSchemesProjectRoot
    );
    expect(result).toEqual(expectedResult);
  });

  it('delegates to createManifestUrlAsync if not using devClient flag', async () => {
    const result = await UrlUtils.constructDeepLinkAsync(projectRoot);
    const expectedResult = await UrlUtils.constructManifestUrlAsync(projectRoot);
    expect(result).toEqual(expectedResult);
  });
});

describe(UrlUtils.constructDevClientUrlAsync, () => {
  it(`throws an error if a scheme is not present in app.json`, async () => {
    await expect(
      UrlUtils.constructDevClientUrlAsync(projectRoot)
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"No scheme specified for development client"`);
  });

  it(`creates an expo-dev-client compatible url if a scheme is provided`, async () => {
    const result = await UrlUtils.constructDevClientUrlAsync(devClientWithSchemesProjectRoot);
    expect(result).toEqual(
      'custom-scheme://expo-development-client/?url=http%3A%2F%2F100.100.1.100%3A80'
    );
  });
});

describe(UrlUtils.constructSourceMapUrlAsync, () => {
  it(`creates a source map url`, async () => {
    await expect(UrlUtils.constructSourceMapUrlAsync(projectRoot, './App.tsx')).resolves.toBe(
      'http://127.0.0.1:80/./App.tsx.map?dev=false&hot=false&minify=true'
    );
  });

  it(`creates a source map url for localhost`, async () => {
    await expect(
      UrlUtils.constructSourceMapUrlAsync(projectRoot, './App.tsx', 'localhost')
    ).resolves.toBe('http://127.0.0.1:80/./App.tsx.map?dev=false&hot=false&minify=true');
  });
});

describe(UrlUtils.isURL, () => {
  it(`guards against protocols`, () => {
    expect(UrlUtils.isURL('http://127.0.0.1:80', { protocols: ['http'] })).toBe(true);
    expect(UrlUtils.isURL('127.0.0.1:80', { requireProtocol: true })).toBe(false);
    expect(UrlUtils.isURL('http://127.0.0.1:80', { protocols: ['https'] })).toBe(false);
    expect(UrlUtils.isURL('http://127.0.0.1:80', {})).toBe(true);
    expect(
      UrlUtils.isURL('127.0.0.1:80', { protocols: ['https', 'http'], requireProtocol: true })
    ).toBe(false);
    expect(UrlUtils.isURL('https://expo.dev/', { protocols: ['https'] })).toBe(true);
    expect(UrlUtils.isURL('', { protocols: ['https'] })).toBe(false);
    expect(UrlUtils.isURL('hello', { protocols: ['https'] })).toBe(false);
  });
});
