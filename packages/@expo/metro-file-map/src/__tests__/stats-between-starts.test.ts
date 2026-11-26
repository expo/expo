/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import FileMap, { DiskCacheManager } from '../index';
import FileDataPlugin from '../plugins/FileDataPlugin';
import type { FileSystem } from '../types';

// memfs is POSIX-only; pin to POSIX path semantics
jest.mock('path', () => jest.requireActual<typeof import('path')>('path').posix);

// memfs, with `lstat` spied on to count stats
jest.mock('fs', () => {
  const { fs } = jest.requireActual<typeof import('memfs')>('memfs');
  return { ...fs, lstat: jest.fn(fs.lstat) };
});

// The node crawler stats a regular file only once data is derived from its
// content, and treats one that was never stat'd as unchanged. These tests
// change files while no FileMap is running, as between two starts of Metro,
// with the file system and cache in memfs.

const rootDir = '/project';
const cacheDirectory = '/cache';

const abs = (normalPath: string) => path.join(rootDir, normalPath);

function write(normalPath: string, content: string) {
  vol.mkdirSync(path.dirname(abs(normalPath)), { recursive: true });
  vol.writeFileSync(abs(normalPath), content);
}

// Timers are faked, so every write has the same modified time. Move it on, as
// an edit some time after the last start would.
let offlineEdits = 0;
function editOffline(normalPath: string, content: string) {
  write(normalPath, content);
  const seconds = Date.now() / 1000 + 60 + ++offlineEdits;
  vol.utimesSync(abs(normalPath), seconds, seconds);
}

const sha1 = (content: string) => createHash('sha1').update(content).digest('hex');

type DependenciesPlugin = FileDataPlugin<readonly string[] | null>;

// Extracts the dependencies of `*.deps.js` files only, when the map is built
function createDependenciesPlugin(): DependenciesPlugin {
  return new FileDataPlugin({
    name: 'dependencies',
    cacheKey: 'dependencies',
    worker: {
      modulePath: require.resolve('../plugins/dependencies/worker'),
      setupArgs: { dependencyExtractor: null },
    },
    filter: ({ normalPath }) => normalPath.endsWith('.deps.js'),
  });
}

function getDependencies(plugin: DependenciesPlugin, filePath: string) {
  const result = plugin.getFileSystem().lookup(filePath);
  return result.exists && result.type === 'f' ? result.pluginData : undefined;
}

async function session(
  fn: (fileSystem: FileSystem, dependencies: DependenciesPlugin) => Promise<void> | void,
  { computeSha1 = false }: { computeSha1?: boolean } = {}
): Promise<void> {
  const dependencies = createDependenciesPlugin();
  const fileMap = new FileMap({
    cacheManagerFactory: ({ buildParameters }) =>
      new DiskCacheManager({ buildParameters }, { cacheDirectory }),
    computeSha1,
    enableSymlinks: true,
    extensions: ['js'],
    healthCheck: {
      enabled: false,
      interval: 10000,
      timeout: 1000,
      filePrefix: '.metro-file-map-health-check',
    },
    maxWorkers: 1,
    plugins: [dependencies],
    retainAllFiles: true,
    rootDir,
    roots: [rootDir],
    useWatchman: false,
    watch: false,
  });
  try {
    const { fileSystem } = await fileMap.build();
    await fn(fileSystem, dependencies);
  } finally {
    await fileMap.end();
  }
}

beforeEach(() => {
  vol.reset();
  vol.mkdirSync(rootDir, { recursive: true });
  vol.mkdirSync(cacheDirectory, { recursive: true });
});

test('a SHA-1 is recomputed after an edit', async () => {
  write('a.js', 'before');
  await session(async (fileSystem) => {
    expect(await fileSystem.getOrComputeSha1(abs('a.js'))).toMatchObject({
      sha1: sha1('before'),
    });
  });

  editOffline('a.js', 'after');

  await session(async (fileSystem) => {
    expect(await fileSystem.getOrComputeSha1(abs('a.js'))).toMatchObject({
      sha1: sha1('after'),
    });
  });
});

test('an eagerly computed SHA-1 is recomputed after an edit', async () => {
  write('a.js', 'before');
  await session(
    (fileSystem) => {
      expect(fileSystem.getSha1(abs('a.js'))).toBe(sha1('before'));
    },
    { computeSha1: true }
  );

  editOffline('a.js', 'after');

  await session(
    (fileSystem) => {
      expect(fileSystem.getSha1(abs('a.js'))).toBe(sha1('after'));
    },
    { computeSha1: true }
  );
});

test("a plugin's data is recomputed after an edit", async () => {
  write('b.deps.js', 'require("before");');
  await session((_, dependencies) => {
    expect(getDependencies(dependencies, abs('b.deps.js'))).toEqual(['before']);
  });

  editOffline('b.deps.js', 'require("after");');

  await session((_, dependencies) => {
    expect(getDependencies(dependencies, abs('b.deps.js'))).toEqual(['after']);
  });
});

test('an edit to a file not yet read is seen when it is first read', async () => {
  write('d.js', 'before');
  await session(() => {});

  editOffline('d.js', 'and after');

  await session(async (fileSystem) => {
    expect(await fileSystem.getOrComputeSha1(abs('d.js'))).toMatchObject({
      sha1: sha1('and after'),
    });
  });
});

test('a retargeted symlink is followed to its new target', async () => {
  write('pkgs/a@1/index.js', 'one');
  write('pkgs/a@2/index.js', 'two');
  vol.mkdirSync(abs('node_modules'));
  const link = abs('node_modules/a');
  // memfs resolves a relative target against the working directory
  vol.symlinkSync(abs('pkgs/a@1'), link);

  await session(async (fileSystem) => {
    expect(fileSystem.lookup(abs('node_modules/a/index.js'))).toMatchObject({
      exists: true,
      realPath: abs('pkgs/a@1/index.js'),
    });
    await fileSystem.getOrComputeSha1(abs('node_modules/a/index.js'));
  });

  // As a package manager upgrading `a`, some time later
  jest.setSystemTime(Date.now() + 60_000);
  vol.unlinkSync(link);
  vol.symlinkSync(abs('pkgs/a@2'), link);
  vol.rmSync(abs('pkgs/a@1'), { recursive: true });

  await session((fileSystem) => {
    expect(fileSystem.lookup(abs('node_modules/a/index.js'))).toMatchObject({
      exists: true,
      realPath: abs('pkgs/a@2/index.js'),
    });
  });
});

test('a start stats only the files with data derived from them', async () => {
  for (let i = 0; i < 10; i++) {
    write(`f${i}.js`, String(i));
  }
  await session(async (fileSystem) => {
    await fileSystem.getOrComputeSha1(abs('f0.js'));
  });

  jest.mocked(fs.lstat).mockClear();
  await session((fileSystem) => {
    // Without a stat, a file's size isn't known
    expect(fileSystem.linkStats(abs('f1.js'))).toEqual({
      fileType: 'f',
      modifiedTime: null,
      size: null,
    });
  });
  expect(jest.mocked(fs.lstat).mock.calls.map(([filePath]) => filePath)).toEqual([abs('f0.js')]);
});
