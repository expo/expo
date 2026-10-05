import inquirer from 'inquirer';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, it, mock } from 'node:test';

import { EXPO_DIR } from '../Constants';
import { syncBundledNativeModulesAsync } from './SyncBundledNativeModules';

afterEach(() => mock.restoreAll());

describe('automated bundled native module sync', () => {
  it('yes sends the checked-in ranges with the www secret without prompting', async () => {
    const previous = process.env.EXPO_SDK_NATIVE_MODULES_SECRET;
    process.env.EXPO_SDK_NATIVE_MODULES_SECRET = 'test-secret';
    try {
      mock.method(inquirer, 'prompt', () => {
        throw new Error('Unexpected prompt');
      });
      const requests: { url: string; options?: RequestInit }[] = [];
      mock.method(globalThis, 'fetch', async (url: string, options?: RequestInit) => {
        requests.push({ url, options });
        return Response.json({ data: [] });
      });
      await syncBundledNativeModulesAsync({ env: 'production', yes: true });
      assert.equal(requests.length, 2);
      const put = requests[1];
      assert.match(put.url, /^https:\/\/api.expo.dev\/v2\/sdks\/\d+\.0\.0\/native-modules\/sync$/);
      assert.equal(put.options?.method, 'put');
      assert.equal(
        new Headers(put.options?.headers).get('expo-sdk-native-modules-secret'),
        'test-secret'
      );
      const bundled = JSON.parse(
        fs.readFileSync(path.join(EXPO_DIR, 'packages/expo/bundledNativeModules.json'), 'utf8')
      );
      assert.deepEqual(
        JSON.parse(put.options?.body as string).nativeModules,
        Object.entries(bundled).map(([npmPackage, versionRange]) => ({ npmPackage, versionRange }))
      );
    } finally {
      if (previous === undefined) delete process.env.EXPO_SDK_NATIVE_MODULES_SECRET;
      else process.env.EXPO_SDK_NATIVE_MODULES_SECRET = previous;
    }
  });

  it('dry run reads www without prompting or writing', async () => {
    mock.method(inquirer, 'prompt', () => {
      throw new Error('Unexpected prompt');
    });
    const requests: string[] = [];
    mock.method(globalThis, 'fetch', async (url: string, options?: RequestInit) => {
      assert.equal(options?.method, undefined);
      requests.push(url);
      return Response.json({ data: [] });
    });
    await syncBundledNativeModulesAsync({ env: 'staging', dryRun: true });
    assert.equal(requests.length, 1);
    assert.match(
      requests[0],
      /^https:\/\/staging-api.expo.dev\/v2\/sdks\/\d+\.0\.0\/native-modules$/
    );
  });

  it('no changes returns to the caller instead of exiting the process', async () => {
    const bundled = JSON.parse(
      fs.readFileSync(path.join(EXPO_DIR, 'packages/expo/bundledNativeModules.json'), 'utf8')
    );
    mock.method(globalThis, 'fetch', async () =>
      Response.json({
        data: Object.entries(bundled).map(([npmPackage, versionRange]) => ({
          npmPackage,
          versionRange,
        })),
      })
    );
    mock.method(process, 'exit', () => {
      throw new Error('Unexpected exit');
    });
    await syncBundledNativeModulesAsync({ env: 'staging', yes: true, dryRun: true });
  });

  it('propagates HTTP errors instead of interpreting them as an empty SDK', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
    await assert.rejects(
      syncBundledNativeModulesAsync({ env: 'staging', yes: true, dryRun: true }),
      /HTTP 503/
    );
  });
});
