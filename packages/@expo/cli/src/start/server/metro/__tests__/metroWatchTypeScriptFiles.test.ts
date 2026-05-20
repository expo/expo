import type MetroServer from '@expo/metro/metro/Server';
import type { ChangeEvent, ChangedFileMetadata } from '@expo/metro/metro-file-map/flow-types';

import type { ServerLike } from '../../BundlerDevServer';
import { metroWatchTypeScriptFiles } from '../metroWatchTypeScriptFiles';

type FileEntry = readonly [string, Readonly<ChangedFileMetadata>];

function createChangeEvent({
  addedFiles = [],
  modifiedFiles = [],
  removedFiles = [],
}: {
  addedFiles?: FileEntry[];
  modifiedFiles?: FileEntry[];
  removedFiles?: FileEntry[];
}): ChangeEvent {
  return {
    changes: {
      addedDirectories: [],
      removedDirectories: [],
      addedFiles,
      modifiedFiles,
      removedFiles,
    },
    rootDir: '/',
  };
}

function createRunner() {
  const listeners = new Map();
  const watcher = {
    addListener: jest.fn((event: string, listener: Function) => {
      listeners.set(event, listener);
    }),
    removeListener: jest.fn(),
  };

  return {
    watcher,
    listeners,
    invoke(event: ChangeEvent) {
      listeners.get('change')(event);
    },
    runner: {
      metro: {
        getBundler: () => ({
          getBundler: () => ({
            getWatcher: () => watcher,
          }),
        }),
      },
      server: {
        addListener: jest.fn(),
      },
    } as any as {
      metro: MetroServer;
      server: ServerLike;
    },
  };
}

describe(metroWatchTypeScriptFiles, () => {
  it(`invokes the callback for every event`, () => {
    const { watcher, runner, invoke } = createRunner();
    const callback = jest.fn();
    metroWatchTypeScriptFiles({ projectRoot: '/app/', callback, ...runner });
    expect(watcher.addListener).toHaveBeenCalledWith('change', expect.any(Function));

    invoke(
      createChangeEvent({
        addedFiles: [
          ['/foo.ts', { isSymlink: false }],
          ['/bar.ts', { isSymlink: false }],
        ],
      })
    );

    expect(callback).toHaveBeenCalledTimes(2);
  });

  for (const filePath of ['/foo.ts', '/bar/foo.tsx', '/app/tsconfig.json']) {
    it(`invokes the callback only when when throttle is set: (${filePath})`, () => {
      const { watcher, runner, invoke } = createRunner();
      const callback = jest.fn();
      metroWatchTypeScriptFiles({ projectRoot: '/app/', callback, throttle: true, ...runner });
      expect(watcher.addListener).toHaveBeenCalledWith('change', expect.any(Function));

      invoke(
        createChangeEvent({
          addedFiles: [
            [filePath, { isSymlink: false }],
            ['/foo.ts', { isSymlink: false }],
          ],
        })
      );

      expect(callback).toHaveBeenCalledTimes(1);
    });
  }

  for (const filePath of [
    '/foo.js',
    '/bar/foo.jsx',
    '/node_modules/foo.tsx',
    '/app/node_modules/bar/index.ts',
    '/app/declaration.d.ts',
    'tsconfig.json',
    '/app/bar/tsconfig.json',
  ]) {
    it(`skips non conforming files: (${filePath})`, () => {
      const { watcher, runner, invoke } = createRunner();
      const callback = jest.fn();
      metroWatchTypeScriptFiles({ projectRoot: '/app/', callback, ...runner });
      expect(watcher.addListener).toHaveBeenCalledWith('change', expect.any(Function));

      invoke(
        createChangeEvent({
          addedFiles: [[filePath, { isSymlink: false }]],
        })
      );

      expect(callback).toHaveBeenCalledTimes(0);
    });
  }

  it(`can accept eventTypes`, () => {
    const { watcher, runner, invoke } = createRunner();
    const callback = jest.fn();
    metroWatchTypeScriptFiles({
      projectRoot: '/app/',
      callback,
      ...runner,
      eventTypes: ['delete'],
    });
    expect(watcher.addListener).toHaveBeenCalledWith('change', expect.any(Function));

    invoke(
      createChangeEvent({
        removedFiles: [['foo.tsx', { isSymlink: false }]],
        addedFiles: [['foo2.tsx', { isSymlink: false }]],
      })
    );

    // Only called once — only 'delete' events are watched
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
