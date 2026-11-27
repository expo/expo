/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

import FileMap from '../index';
import type { ChangeEvent, FileSystem } from '../types';

// A FileMap in watch mode, with the watcher backend it uses on this platform
// (FallbackWatcher, or NativeWatcher on macOS), against a real file system.
// Changes are made after the initial crawl and checked through the file system
// the build returned.

// Real fs.watch; jest.setup.ts mocks fs.
jest.unmock('fs');
jest.unmock('fs/promises');

jest.useRealTimers();
jest.setTimeout(30000);

let rootDir: string;
let fileMap: FileMap;
let fileSystem: FileSystem;
let removedFiles: Set<string>;

const abs = (normalPath: string) => path.join(rootDir, normalPath);

function write(normalPath: string, content: string = '') {
  fs.mkdirSync(path.dirname(abs(normalPath)), { recursive: true });
  fs.writeFileSync(abs(normalPath), content);
}

async function until(label: string, check: () => boolean): Promise<void> {
  const deadline = Date.now() + 10000;
  while (!check()) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for: ${label}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

const exists = (normalPath: string) => fileSystem.exists(abs(normalPath));

function createFileMap({
  onCacheWrite,
  retainAllFiles,
  roots = [rootDir],
}: {
  onCacheWrite?: () => Promise<void>;
  retainAllFiles: boolean;
  roots?: readonly string[];
}) {
  return new FileMap({
    cacheManagerFactory: () => ({
      read: async () => null,
      write: async () => {
        await onCacheWrite?.();
      },
      end: async () => {},
    }),
    enableSymlinks: true,
    extensions: ['js'],
    healthCheck: {
      enabled: false,
      interval: 10000,
      timeout: 1000,
      filePrefix: '.metro-file-map-health-check',
    },
    ignorePattern: /ignored-dir/,
    maxWorkers: 1,
    retainAllFiles,
    rootDir,
    roots,
    useWatchman: false,
    watch: true,
  });
}

describe('FileMap in watch mode', () => {
  beforeEach(async () => {
    // The native realpath, so that a Windows temp directory's 8.3 short name is
    // expanded: libuv 1.52 crashes watching one (libuv#5010).
    rootDir = fs.realpathSync.native(
      fs.mkdtempSync(path.join(os.tmpdir(), 'metro-file-map-watch-'))
    );
    write('src/deep/a/b/c/one.js');
    write('src/two.js');
    write('pkg/real/index.js');
    write('ignored-dir/x.js');
    for (let i = 0; i < 20; i++) {
      write(`many/d${i}/f.js`);
    }
    fs.mkdirSync(abs('node_modules'));
    fs.symlinkSync(path.join('..', 'pkg', 'real'), abs('node_modules/linked'), 'junction');

    removedFiles = new Set();
    fileMap = createFileMap({ retainAllFiles: true });
    ({ fileSystem } = await fileMap.build());
    fileMap.on('change', ({ changes }: ChangeEvent) => {
      for (const [canonicalPath] of changes.removedFiles) {
        removedFiles.add(canonicalPath);
      }
    });
  });

  afterEach(async () => {
    await fileMap.end();
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  test('reports a new file in a directory that existed at startup', async () => {
    write('src/deep/a/b/c/new.js');
    await until('new.js added', () => exists('src/deep/a/b/c/new.js'));
  });

  test('watches every directory that existed at startup', async () => {
    for (let i = 0; i < 20; i++) {
      write(`many/d${i}/g.js`);
    }
    await until('all added', () =>
      Array.from({ length: 20 }, (_, i) => exists(`many/d${i}/g.js`)).every(Boolean)
    );
  });

  test('removes the files under a deleted directory', async () => {
    fs.rmSync(abs('src/deep'), { recursive: true });
    await until('one.js removed', () => !exists('src/deep/a/b/c/one.js'));
    expect(removedFiles).toContain(path.join('src', 'deep', 'a', 'b', 'c', 'one.js'));
    expect(exists('src/two.js')).toBe(true);
  });

  test('removes the files under a directory moved out of the root', async () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'metro-file-map-out-'));
    try {
      fs.renameSync(abs('many/d7'), path.join(outside, 'd7'));
      await until('f.js removed', () => !exists('many/d7/f.js'));
      expect(exists('many/d8/f.js')).toBe(true);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('reports files in a new directory, and files added to it later', async () => {
    write('fresh/sub/new.js');
    await until('new.js added', () => exists('fresh/sub/new.js'));
    write('fresh/sub/later.js');
    await until('later.js added', () => exists('fresh/sub/later.js'));
  });

  test('removes a deleted symlink', async () => {
    expect(fileSystem.linkStats(abs('node_modules/linked'))).toMatchObject({
      fileType: 'l',
    });
    // A junction on Windows, which is removed as a directory
    (process.platform === 'win32' ? fs.rmdirSync : fs.unlinkSync)(abs('node_modules/linked'));
    await until('link removed', () => fileSystem.linkStats(abs('node_modules/linked')) == null);
  });

  test('ignores changes in an ignored directory', async () => {
    write('ignored-dir/y.js');
    write('src/marker.js');
    await until('marker.js added', () => exists('src/marker.js'));
    expect(exists('ignored-dir/y.js')).toBe(false);
  });

  // The crawl skips node_modules without `retainAllFiles`, but changes in it
  // are still reported in watch mode.
  test('watches a directory the crawl skips', async () => {
    write('node_modules/pkg/index.js');
    await fileMap.end();
    fileMap = createFileMap({ retainAllFiles: false });
    ({ fileSystem } = await fileMap.build());
    expect(exists('node_modules/pkg/index.js')).toBe(false);

    write('node_modules/pkg/new.js');
    await until('new.js added', () => exists('node_modules/pkg/new.js'));
  });

  // As Metro passes `watchFolders`, without normalizing them
  test('watches every directory under a root given unnormalized', async () => {
    await fileMap.end();
    fileMap = createFileMap({
      retainAllFiles: true,
      roots: [rootDir + path.sep],
    });
    ({ fileSystem } = await fileMap.build());

    write('src/deep/a/b/c/new.js');
    await until('new.js added', () => exists('src/deep/a/b/c/new.js'));
  });

  // The cache is written after the crawl, and before build() starts watching.
  test('reports a file added while the file map builds', async () => {
    await fileMap.end();
    fileMap = createFileMap({
      onCacheWrite: async () => {
        write('src/during-build.js');
        // Long enough for an FSEvents stream started after this not to report
        // the change.
        await new Promise((resolve) => setTimeout(resolve, 500));
      },
      retainAllFiles: true,
    });
    ({ fileSystem } = await fileMap.build());

    await until('during-build.js added', () => exists('src/during-build.js'));
  });
});
