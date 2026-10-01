import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { syncBundledNativeModulesAsync, syncNativeModulesEndpointsAsync } from './NativeModules';

type Request = { url: string; init?: RequestInit };

const originalFetch = globalThis.fetch;
let requests: Request[] = [];

function mockFetch(remote: Record<string, string>, putStatus = 200): void {
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    requests.push({ url, init });
    if (init?.method === 'put') {
      return new Response(putStatus === 200 ? '{}' : 'Invalid secret', { status: putStatus });
    }
    const data = Object.entries(remote).map(([npmPackage, versionRange]) => ({
      npmPackage,
      versionRange,
    }));
    return new Response(JSON.stringify({ data }), { status: 200 });
  }) as typeof fetch;
}

beforeEach(() => {
  requests = [];
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('syncBundledNativeModulesAsync', () => {
  it('does not update the endpoint when it already matches', async () => {
    mockFetch({ 'expo-camera': '~58.0.6' });
    const changes = await syncBundledNativeModulesAsync({
      env: 'staging',
      sdkVersion: '58.0.0',
      secret: 'secret',
      bundledNativeModules: { 'expo-camera': '~58.0.6' },
    });
    assert.deepEqual(changes, []);
    assert.deepEqual(
      requests.map((request) => request.url),
      ['https://staging-api.expo.dev/v2/sdks/58.0.0/native-modules']
    );
  });

  it('uploads the full module list when versions changed', async () => {
    mockFetch({ 'expo-camera': '~58.0.5', 'expo-removed': '~1.0.0' });
    const changes = await syncBundledNativeModulesAsync({
      env: 'production',
      sdkVersion: '58.0.0',
      secret: 'secret',
      bundledNativeModules: { 'expo-camera': '~58.0.6', 'expo-image': '~58.0.9' },
    });
    assert.deepEqual(changes, [
      { npmPackage: 'expo-camera', from: '~58.0.5', to: '~58.0.6' },
      { npmPackage: 'expo-image', from: null, to: '~58.0.9' },
      { npmPackage: 'expo-removed', from: '~1.0.0', to: null },
    ]);
    const put = requests[1];
    assert.equal(put.url, 'https://api.expo.dev/v2/sdks/58.0.0/native-modules/sync');
    assert.equal(
      (put.init?.headers as Record<string, string>)['expo-sdk-native-modules-secret'],
      'secret'
    );
    assert.deepEqual(JSON.parse(put.init?.body as string), {
      nativeModules: [
        { npmPackage: 'expo-camera', versionRange: '~58.0.6' },
        { npmPackage: 'expo-image', versionRange: '~58.0.9' },
      ],
    });
  });

  it('throws when the endpoint rejects the update', async () => {
    mockFetch({ 'expo-camera': '~58.0.5' }, 401);
    await assert.rejects(
      syncBundledNativeModulesAsync({
        env: 'staging',
        sdkVersion: '58.0.0',
        secret: 'wrong',
        bundledNativeModules: { 'expo-camera': '~58.0.6' },
      }),
      /Invalid secret/
    );
  });
});

describe('syncNativeModulesEndpointsAsync', () => {
  it('reports both environments as failed without a secret and makes no requests', async () => {
    mockFetch({});
    const results = await syncNativeModulesEndpointsAsync({
      sdkVersion: '58.0.0',
      secret: undefined,
      bundledNativeModules: { 'expo-camera': '~58.0.6' },
    });
    assert.deepEqual(
      results.map(({ env, status }) => ({ env, status })),
      [
        { env: 'staging', status: 'failed' },
        { env: 'production', status: 'failed' },
      ]
    );
    assert.equal(requests.length, 0);
  });

  it('continues to production when staging fails', async () => {
    const remote = [{ npmPackage: 'expo-camera', versionRange: '~58.0.5' }];
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      requests.push({ url, init });
      if (init?.method === 'put') {
        return url.includes('staging-api')
          ? new Response('Invalid secret', { status: 401 })
          : new Response('{}', { status: 200 });
      }
      return new Response(JSON.stringify({ data: remote }), { status: 200 });
    }) as typeof fetch;
    const results = await syncNativeModulesEndpointsAsync({
      sdkVersion: '58.0.0',
      secret: 'secret',
      bundledNativeModules: { 'expo-camera': '~58.0.6' },
    });
    assert.equal(results[0].env, 'staging');
    assert.equal(results[0].status, 'failed');
    assert.match(results[0].error ?? '', /Invalid secret/);
    assert.deepEqual(
      { env: results[1].env, status: results[1].status },
      { env: 'production', status: 'synced' }
    );
  });
});
