import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it, mock } from 'node:test';

import { VersionsApiHost, VersionsSchema } from '../Versions';
import {
  getPublishedPackagesPlanAsync,
  PublishedPackagesPlan,
  syncPublishedPackagesAsync,
} from './SyncPublishedPackages';

const plan: PublishedPackagesPlan = {
  sdkVersion: '58.0.0',
  tag: 'sdk-58',
  expoVersion: '~58.0.1',
  templates: [{ name: 'expo-template-default', version: '58.0.10' }],
  packages: [
    { name: 'expo', version: '58.0.1' },
    { name: 'expo-template-default', version: '58.0.10' },
  ],
};

function dependencies(npmVersion = '11.21.0') {
  const commands: string[][] = [];
  const writes: unknown[] = [];
  const versions: VersionsSchema = {
    sdkVersions: { '58.0.0': { expoVersion: '~58.0.0', iosClientVersion: 'keep' } },
    turtleSdkVersions: { android: '58.0.0', ios: '58.0.0' },
  };
  return {
    commands,
    writes,
    spawn: async (command: string, args: string[]) => {
      commands.push([command, ...args]);
      return { pid: 1, output: ['', ''], stdout: npmVersion, stderr: '', status: 0, signal: null };
    },
    view: async (pkg: { version: string }) => pkg.version,
    syncModules: async (options: unknown) => {
      writes.push(options);
    },
    getVersions: async () => structuredClone(versions),
    setVersions: async (value: VersionsSchema, host?: VersionsApiHost) => {
      writes.push({ value, host });
    },
  };
}

afterEach(() => mock.restoreAll());

describe('sync-published-packages', () => {
  it('derives SDK tags from expo, filters private templates, and validates bundled minimums', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'expo-sync-published-'));
    try {
      await fs.writeFile(
        path.join(root, 'pnpm-workspace.yaml'),
        'packages:\n  - packages/*\n  - templates/*\n'
      );
      for (const [file, value] of Object.entries({
        'package.json': { name: 'sync-fixture', private: true, packageManager: 'pnpm@12.2.1' },
        'packages/expo/package.json': { name: 'expo', version: '58.0.1' },
        'packages/expo/bundledNativeModules.json': {
          'expo-asset': '~58.0.9',
          'react-native': '0.88.0-rc.3',
        },
        'templates/default/package.json': { name: 'expo-template-default', version: '58.0.10' },
        'templates/internal/package.json': { name: 'internal', version: '1.0.0', private: true },
      })) {
        await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
        await fs.writeFile(path.join(root, file), JSON.stringify(value));
      }
      const result = await getPublishedPackagesPlanAsync(root);
      assert.equal(result.tag, 'sdk-58');
      assert.deepEqual(result.templates, plan.templates);
      assert.deepEqual(result.packages.slice(-2), [
        { name: 'expo-asset', version: '58.0.9' },
        { name: 'react-native', version: '0.88.0-rc.3' },
      ]);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it('dry run never writes tags or versions and passes dry run to bundled-module sync', async () => {
    const deps = dependencies();
    await syncPublishedPackagesAsync(plan, { env: 'production', dryRun: true }, deps);
    assert.deepEqual(deps.commands, [['npm', '--version']]);
    assert.deepEqual(deps.writes, [{ env: 'production', yes: true, dryRun: true }]);
  });

  it('rejects unavailable versions before any remote writes', async () => {
    const deps = dependencies();
    deps.view = async () => '58.0.0';
    await assert.rejects(
      syncPublishedPackagesAsync(plan, { env: 'production', dryRun: true }, deps),
      /not published on public npm/
    );
    assert.deepEqual(deps.writes, []);
    assert.deepEqual(deps.commands, [['npm', '--version']]);
  });

  it('fails on registry errors without polling or remote writes', async () => {
    const deps = dependencies();
    let calls = 0;
    deps.view = async () => {
      calls++;
      throw new Error('Registry unavailable');
    };
    await assert.rejects(
      syncPublishedPackagesAsync(plan, { env: 'production', dryRun: true }, deps),
      /Registry unavailable/
    );
    assert.equal(calls, plan.packages.length);
    assert.deepEqual(deps.writes, []);
    assert.deepEqual(deps.commands, [['npm', '--version']]);
  });

  it('syncs staging endpoints without npm checks or dist-tag updates', async () => {
    const previous = { ...process.env };
    process.env.EXPO_VERSIONS_SECRET = 'test';
    process.env.EXPO_SDK_NATIVE_MODULES_SECRET = 'test';
    try {
      const deps = dependencies('11.20.0');
      deps.view = async () => {
        assert.fail('Staging must not query the npm registry');
      };
      await syncPublishedPackagesAsync(plan, { env: 'staging', dryRun: false }, deps);
      assert.deepEqual(deps.commands, []);
      assert.deepEqual(deps.writes[0], { env: 'staging', yes: true, dryRun: false });
      const written = deps.writes[1] as { value: VersionsSchema; host: VersionsApiHost };
      assert.equal(written.host, VersionsApiHost.STAGING);
      assert.deepEqual(written.value.sdkVersions['58.0.0'], {
        expoVersion: '~58.0.1',
        iosClientVersion: 'keep',
      });
    } finally {
      for (const key of ['EXPO_VERSIONS_SECRET', 'EXPO_SDK_NATIVE_MODULES_SECRET']) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    }
  });

  it('uses npm for exact template versions and preserves other SDK metadata', async () => {
    const previous = { ...process.env };
    process.env.EXPO_VERSIONS_SECRET = 'test';
    process.env.EXPO_SDK_NATIVE_MODULES_SECRET = 'test';
    try {
      const deps = dependencies();
      await syncPublishedPackagesAsync(plan, { env: 'production', dryRun: false }, deps);
      assert.deepEqual(deps.commands[1], [
        'npm',
        'dist-tag',
        'add',
        'expo-template-default@58.0.10',
        'sdk-58',
        '--registry=https://registry.npmjs.org/',
      ]);
      assert.deepEqual(deps.writes[0], { env: 'production', yes: true, dryRun: false });
      const written = deps.writes[1] as { value: VersionsSchema; host: VersionsApiHost };
      assert.equal(written.host, VersionsApiHost.PRODUCTION);
      assert.deepEqual(written.value.sdkVersions['58.0.0'], {
        expoVersion: '~58.0.1',
        iosClientVersion: 'keep',
      });
    } finally {
      for (const key of ['EXPO_VERSIONS_SECRET', 'EXPO_SDK_NATIVE_MODULES_SECRET']) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    }
  });

  for (const version of ['11.20.0', '12.1.0']) {
    it(`rejects npm ${version} before attempting sync`, async () => {
      const deps = dependencies(version);
      await assert.rejects(
        syncPublishedPackagesAsync(plan, { env: 'production', dryRun: true }, deps),
        /OIDC dist-tags require/
      );
      assert.deepEqual(deps.writes, []);
    });
  }
});
