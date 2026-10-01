import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  promoteVersionsToProductionAsync,
  setVersionsAsync,
  VersionsApiHost,
  VersionsSchema,
} from './Versions';

type Request = { url: string; init?: RequestInit };

const originalFetch = globalThis.fetch;
const originalSecret = process.env.EXPO_VERSIONS_SECRET;
let requests: Request[] = [];

function versions(expoVersion: string): VersionsSchema {
  return {
    sdkVersions: { '58.0.0': { expoVersion } },
    turtleSdkVersions: { android: '1.0.0', ios: '1.0.0' },
  };
}

function mockFetch({
  staging,
  production,
  update = { status: 200, body: { data: {} } },
}: {
  staging?: VersionsSchema;
  production?: VersionsSchema;
  update?: { status: number; body: unknown };
}): void {
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    requests.push({ url, init });
    if (url.endsWith('/v2/versions/update')) {
      return new Response(JSON.stringify(update.body), { status: update.status });
    }
    const data = url.includes(VersionsApiHost.STAGING) ? staging : production;
    return new Response(JSON.stringify({ data }), { status: 200 });
  }) as typeof fetch;
}

beforeEach(() => {
  requests = [];
  process.env.EXPO_VERSIONS_SECRET = 'secret';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.EXPO_VERSIONS_SECRET = originalSecret;
});

describe('setVersionsAsync', () => {
  it('throws when the endpoint responds with an error status', async () => {
    mockFetch({ update: { status: 401, body: { errors: [{ message: 'Invalid secret' }] } } });
    await assert.rejects(setVersionsAsync(versions('~58.0.1')), /Invalid secret/);
  });

  it('throws when the endpoint returns errors with a success status', async () => {
    mockFetch({ update: { status: 200, body: { errors: [{ message: 'Invalid secret' }] } } });
    await assert.rejects(setVersionsAsync(versions('~58.0.1')), /Invalid secret/);
  });
});

describe('promoteVersionsToProductionAsync', () => {
  it('does not update production when it already matches staging', async () => {
    mockFetch({ staging: versions('~58.0.1'), production: versions('~58.0.1') });
    assert.equal(await promoteVersionsToProductionAsync(), null);
    assert.equal(
      requests.some((request) => request.url.endsWith('/v2/versions/update')),
      false
    );
  });

  it('copies the staging configuration to production', async () => {
    mockFetch({ staging: versions('~58.0.1'), production: versions('~58.0.0') });
    const result = await promoteVersionsToProductionAsync();
    assert.notEqual(result, null);
    const update = requests.find((request) => request.url.endsWith('/v2/versions/update'));
    assert.equal(update?.url, `https://${VersionsApiHost.PRODUCTION}/v2/versions/update`);
    assert.deepEqual(JSON.parse(update?.init?.body as string), {
      value: versions('~58.0.1'),
      secret: 'secret',
    });
  });
});
