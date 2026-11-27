import type FileMap from '@expo/metro-file-map';
import type { ChangeEvent } from '@expo/metro-file-map';
import TreeFS from '@expo/metro-file-map/build/lib/TreeFS';
import type { ConfigT } from '@expo/metro/metro-config';
import type MetroServer from '@expo/metro/metro/Server';
import { vol } from 'memfs';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import type { Server } from 'node:http';

import { debugEvent } from '../../metroDebugEvents';
import { injectMetroFileMapWatcher } from '../injectMetroFileMapWatcher';

jest.mock('../../metroDebugEvents', () => ({
  debugEvent: Object.assign(jest.fn(), { error: (error: unknown) => error }),
}));

const config = { projectRoot: '/project', resolver: { blockList: [] } } as unknown as ConfigT;

let tree: TreeFS;
let fileMap: FileMap;
let metro: MetroServer;
let server: Server;
let injected: ReturnType<typeof injectMetroFileMapWatcher> | undefined;

function createWatcher(options: Partial<Parameters<typeof injectMetroFileMapWatcher>[2]> = {}) {
  return injectMetroFileMapWatcher({ metro, server }, config, {
    files: ['.env'],
    watch: false,
    ...options,
  });
}

function mockNativeWatcher() {
  const callbacks = new Map<string, (event: string, filename: string | null) => void>();
  const watcher = Object.assign(new EventEmitter(), { close: jest.fn() });
  const watch = jest.spyOn(fs, 'watch').mockImplementation(((
    directory: string,
    _options: unknown,
    listener: (event: string, filename: string | null) => void
  ) => {
    callbacks.set(directory, listener);
    return watcher;
  }) as any);
  return {
    watcher,
    watch,
    notify(filename = '.env', event = 'change', directory = '/project') {
      callbacks.get(directory)!(event, filename);
    },
  };
}

afterEach(() => {
  injected?.dispose();
  injected = undefined;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

beforeEach(() => {
  jest.mocked(debugEvent).mockReset();
  server = new EventEmitter() as unknown as Server;
  vol.reset();
  vol.mkdirSync('/project');
  tree = new TreeFS({ rootDir: '/project', processFile: () => null });
  fileMap = Object.assign(new EventEmitter(), {
    build: async () => ({ fileSystem: tree }),
  }) as unknown as FileMap;
  metro = {
    ready: async () => {},
    getBundler: () => ({ getBundler: () => ({ getWatcher: () => fileMap }) }),
  } as unknown as MetroServer;
});

test('inserts only targeted regular files after discovery', async () => {
  vol.fromJSON({ '/project/.env': 'A=1', '/project/README': 'text' });
  injected = createWatcher({ files: ['/project/.env'] });
  await injected.ready;
  expect(tree.getAllFiles()).toEqual(['/project/.env']);
  injected.dispose();
});

test('batches directory watcher updates, deduplicates Metro events, repairs recrawls, and cleans up', async () => {
  jest.useFakeTimers();
  const { watch, watcher, notify } = mockNativeWatcher();
  const listener = jest.fn((_event: ChangeEvent) =>
    expect(tree.exists('/project/.env')).toBe(vol.existsSync('/project/.env'))
  );
  injected = createWatcher({ files: ['/project/.env', '/project/.env.local'], watch: true });
  injected.onChange(listener);
  await injected.ready;
  expect(watch).toHaveBeenCalledTimes(1);
  const refresh = () => notify('.env', 'rename');
  vol.writeFileSync('/project/README', 'ignored');
  notify('README');
  expect(jest.getTimerCount()).toBe(0);
  jest.runOnlyPendingTimers();
  expect(listener).not.toHaveBeenCalled();
  vol.writeFileSync('/project/.env', 'A=1');
  refresh();
  refresh();
  jest.runOnlyPendingTimers();
  expect(listener).toHaveBeenCalledTimes(1);
  expect([...listener.mock.calls[0]![0].changes.addedFiles].map(([file]) => file)).toEqual([
    '.env',
  ]);
  const event = (kind: string) => ({
    rootDir: '/project',
    changes: { [kind]: new Map([['.env', { modifiedTime: 1, isSymlink: false }]]) },
  });
  fileMap.emit('change', event('addedFiles'));
  expect(listener).toHaveBeenCalledTimes(1);
  tree.remove('.env');
  fileMap.emit('change', event('removedFiles'));
  expect(tree.exists('.env')).toBe(true);
  expect(listener).toHaveBeenCalledTimes(1);
  vol.writeFileSync('/project/.env.tmp', 'A=longer');
  vol.renameSync('/project/.env.tmp', '/project/.env');
  refresh();
  jest.runOnlyPendingTimers();
  expect(listener).toHaveBeenCalledTimes(2);
  vol.unlinkSync('/project/.env');
  refresh();
  jest.runOnlyPendingTimers();
  expect(listener).toHaveBeenCalledTimes(3);
  expect([...listener.mock.calls[2]![0].changes.removedFiles].map(([file]) => file)).toEqual([
    '.env',
  ]);
  injected.dispose();
  expect(watcher.close).toHaveBeenCalledTimes(1);
});

test('falls back to polling on native watcher errors and disposes the fallback', async () => {
  vol.writeFileSync('/project/.env', 'A=1');
  const { watcher } = mockNativeWatcher();
  const poll = jest.spyOn(fs, 'watchFile').mockReturnValue({} as fs.StatWatcher);
  const unwatch = jest.spyOn(fs, 'unwatchFile').mockImplementation(() => {});
  injected = createWatcher({ files: ['/project/.env'], watch: true });
  await injected.ready;
  expect(poll).not.toHaveBeenCalled();
  watcher.emit('error', new Error('watch unavailable'));
  expect(watcher.close).toHaveBeenCalledTimes(1);
  expect(poll).toHaveBeenCalledWith(
    '/project/.env',
    { persistent: false, interval: 500 },
    expect.any(Function)
  );
  injected.dispose();
  expect(unwatch).toHaveBeenCalledWith('/project/.env', expect.any(Function));
});

test('leaves Metro-owned symlinks and directories intact', async () => {
  vol.fromJSON({ '/project/.env/inside.js': '', '/project/target.js': '' });
  vol.symlinkSync('target.js', '/project/.env.local');
  tree.bulkAddOrModify(
    new Map([
      ['.env/inside.js', [0, 0, 0, null, 0, null]],
      ['target.js', [0, 0, 0, null, 0, null]],
      ['.env.local', [0, 0, 0, null, 'target.js', null]],
    ])
  );
  injected = createWatcher({ files: ['/project/.env', '/project/.env.local'] });
  await injected.ready;
  expect(tree.exists('.env/inside.js')).toBe(true);
  expect(tree.exists('.env.local')).toBe(true);
});

test('does not emit empty events for duplicate native notifications', async () => {
  jest.useFakeTimers();
  vol.writeFileSync('/project/.env', 'A=1');
  const { notify } = mockNativeWatcher();
  const listener = jest.fn();
  fileMap.on('change', listener);
  injected = createWatcher({ files: ['/project/.env'], watch: true });
  await injected.ready;
  listener.mockClear();
  notify();
  jest.runOnlyPendingTimers();
  expect(listener).not.toHaveBeenCalled();
});

test('removes its stale file entry when a target becomes a directory', async () => {
  vol.writeFileSync('/project/.env', 'A=1');
  injected = createWatcher({ files: ['/project/.env'] });
  await injected.ready;
  vol.unlinkSync('/project/.env');
  vol.mkdirSync('/project/.env');
  const event = { changes: {}, rootDir: '/project' };
  fileMap.emit('change', event);
  expect(tree.exists('.env')).toBe(false);
  expect([...(event as ChangeEvent).changes.removedFiles].map(([file]) => file)).toEqual(['.env']);
});

test('treats inspection failures as missing and preserves other Metro events', async () => {
  const report = jest.mocked(debugEvent);
  vol.writeFileSync('/project/.env', 'A=1');
  injected = createWatcher({ files: ['/project/.env'] });
  await injected.ready;
  jest.spyOn(fs, 'lstatSync').mockImplementation(() => {
    throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
  });
  const listener = jest.fn();
  fileMap.on('change', listener);
  const event = {
    changes: { addedFiles: new Map([['other.js', { isSymlink: false }]]) },
    rootDir: '/project',
  };
  expect(() => fileMap.emit('change', event)).not.toThrow();
  expect(tree.exists('.env')).toBe(false);
  expect(listener).toHaveBeenCalledWith(event);
  expect(report).not.toHaveBeenCalled();
  expect([...listener.mock.calls[0]![0].changes.removedFiles].map(([file]) => file)).toEqual([
    '.env',
  ]);
});

test('inserts files after an existing build and exposes the same synchronized Metro event', async () => {
  vol.writeFileSync('/project/.env', 'A=1');
  await fileMap.build();
  const metroListener = jest.fn();
  jest.spyOn(metro, 'ready').mockImplementation(async () => {
    await Promise.resolve();
    fileMap.on('change', metroListener);
  });
  injected = createWatcher({ files: ['/project/.env'] });
  const listener = jest.fn((_event: ChangeEvent) => expect(tree.exists('.env')).toBe(true));
  const unsubscribe = injected.onChange(listener);
  await injected.ready;
  expect(listener).toHaveBeenCalledTimes(1);
  expect(metroListener.mock.invocationCallOrder[0]).toBeLessThan(
    listener.mock.invocationCallOrder[0]!
  );
  expect(listener.mock.calls[0]![0]).toBe(metroListener.mock.calls[0]![0]);
  expect([...listener.mock.calls[0]![0].changes.addedFiles].map(([file]) => file)).toEqual([
    '.env',
  ]);
  unsubscribe();
  vol.writeFileSync('/project/.env', 'A=longer');
  fileMap.emit('change', { rootDir: '/project', changes: {} });
  expect(metroListener).toHaveBeenCalledTimes(2);
  expect(listener).toHaveBeenCalledTimes(1);
});

test('preserves Metro-owned symlink removals for downstream listeners', async () => {
  vol.writeFileSync('/project/target.js', '');
  vol.symlinkSync('target.js', '/project/.env');
  tree.bulkAddOrModify(
    new Map([
      ['target.js', [0, 0, 0, null, 0, null]],
      ['.env', [0, 0, 0, null, 'target.js', null]],
    ])
  );
  injected = createWatcher({ files: ['/project/.env'] });
  await injected.ready;
  const listener = jest.fn();
  injected.onChange(listener);
  vol.unlinkSync('/project/.env');
  tree.remove('.env');
  const event = {
    rootDir: '/project',
    changes: { removedFiles: new Map([['.env', { isSymlink: true }]]) },
  };
  fileMap.emit('change', event);
  expect([...event.changes.removedFiles]).toEqual([['.env', { isSymlink: true }]]);
  expect(listener).toHaveBeenCalledWith(event);
});

test('preserves the root of Metro events', async () => {
  injected = createWatcher({ files: ['/project/.env'] });
  await injected.ready;
  const event = { rootDir: '/custom-root', changes: {} };
  fileMap.emit('change', event);
  expect(event.rootDir).toBe('/custom-root');
});

test('uses the config root and filters blocklisted candidates internally', async () => {
  vol.fromJSON({
    '/project/.env': 'A=1',
    '/project/.env.local': 'B=1',
    '/project/.env.development': 'C=1',
  });
  vol.mkdirSync('/project/metro-root');
  tree = new TreeFS({ rootDir: '/project/metro-root', processFile: () => null });
  injected = injectMetroFileMapWatcher(
    { metro, server },
    {
      ...config,
      projectRoot: '/project/metro-root',
      resolver: { ...config.resolver, blockList: /\.env(\.local)?$/g },
    },
    {
      files: ['/project/.env', '/project/.env.local', '/project/.env.development'],
      watch: false,
    }
  );
  await injected.ready;
  expect(tree.getAllFiles()).toEqual(['/project/.env.development']);
});

test('normalizes relative and absolute paths before blocklist filtering and watching', async () => {
  vol.fromJSON({
    '/project/.env': 'A=1',
    '/project/.env.local': 'B=1',
    '/project/shared/.env': 'C=1',
  });
  const { watch } = mockNativeWatcher();
  const localConfig = {
    ...config,
    resolver: { ...config.resolver, blockList: /^\/project\/\.env\.local$/ },
  };
  injected = injectMetroFileMapWatcher({ metro, server }, localConfig, {
    files: ['.env', './nested/../.env', '/project/.env', '.env.local', 'shared/.env'],
    watch: true,
  });
  const listener = jest.fn();
  injected.onChange(listener);
  await injected.ready;
  expect(tree.getAllFiles().sort()).toEqual(['/project/.env', '/project/shared/.env']);
  expect(watch.mock.calls.map(([directory]) => directory).sort()).toEqual([
    '/project',
    '/project/shared',
  ]);
  expect([...listener.mock.calls[0]![0].changes.addedFiles].map(([file]) => file).sort()).toEqual([
    '.env',
    'shared/.env',
  ]);
});

test.each(['get watcher', 'discovery', 'synchronous discovery', 'build', 'insert'] as const)(
  'continues startup after %s failure and cleans up safely',
  async (failure) => {
    vol.fromJSON({ '/project/.env': 'A=1', '/project/.env.local': 'B=1' });
    const report = jest.mocked(debugEvent);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const watcher = Object.assign(new EventEmitter(), { close: jest.fn() });
    const watch = jest.spyOn(fs, 'watch').mockReturnValue(watcher as unknown as fs.FSWatcher);
    const error = new Error(`${failure} failed`);
    if (failure === 'get watcher') {
      jest.spyOn(metro, 'getBundler').mockImplementation(() => {
        throw error;
      });
    } else if (failure === 'discovery' || failure === 'synchronous discovery') {
      jest.spyOn(metro, 'ready').mockImplementation(() => {
        if (failure === 'synchronous discovery') throw error;
        return Promise.reject(error);
      });
    } else if (failure === 'build') {
      jest.spyOn(fileMap, 'build').mockRejectedValue(error);
    } else {
      const add = tree.addOrModify.bind(tree);
      jest.spyOn(tree, 'addOrModify').mockImplementation((...args) => {
        if (args[0] === '.env.local') throw error;
        add(...args);
      });
    }
    const baselineListeners = fileMap.listenerCount('change');
    injected = createWatcher({ files: ['.env', '.env.local'], watch: true });
    await expect(injected.ready).resolves.toBeUndefined();
    expect(report).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith('file_map_watcher_error', { source: 'watcher', error });
    expect(tree.getAllFiles()).toEqual([]);
    expect(fileMap.listenerCount('change')).toBe(baselineListeners);
    injected.dispose();
    injected.dispose();
    expect(watcher.close).toHaveBeenCalledTimes(failure === 'insert' ? 1 : 0);
    expect(watch).toHaveBeenCalledTimes(failure === 'insert' ? 1 : 0);
  }
);

test('does not roll back files after their initial event has reached Metro', async () => {
  vol.writeFileSync('/project/.env', 'A=1');
  const { watcher } = mockNativeWatcher();
  fileMap.on('change', () => {
    throw new Error('listener failed');
  });
  injected = createWatcher({ watch: true });
  await expect(injected.ready).resolves.toBeUndefined();
  expect(tree.exists('.env')).toBe(true);
  expect(watcher.close).not.toHaveBeenCalled();
});

test('disposes on owner close and supports repeated disposal', async () => {
  const server = new EventEmitter() as unknown as Server;
  const { watcher } = mockNativeWatcher();
  injected = injectMetroFileMapWatcher({ metro, server }, config, { files: ['.env'], watch: true });
  await injected.ready;
  server.emit('close');
  expect(watcher.close).toHaveBeenCalledTimes(1);
  expect(fileMap.listenerCount('change')).toBe(0);
  injected.dispose();
  server.emit('close');
  expect(watcher.close).toHaveBeenCalledTimes(1);
});

test('resolves readiness and completes cleanup even when debug reporting throws', async () => {
  vol.fromJSON({ '/project/.env': 'A=1', '/project/.env.local': 'B=1' });
  const { watcher } = mockNativeWatcher();
  const report = jest.mocked(debugEvent).mockImplementationOnce(() => {
    throw new Error('logging failed');
  });
  const add = tree.addOrModify.bind(tree);
  jest.spyOn(tree, 'addOrModify').mockImplementation((...args) => {
    if (args[0] === '.env.local') throw new Error('insert failed');
    add(...args);
  });
  const rollback = jest.spyOn(tree, 'remove');
  injected = createWatcher({ files: ['.env', '.env.local'], watch: true });
  await expect(injected.ready).resolves.toBeUndefined();
  expect(rollback).toHaveBeenCalledWith('.env');
  expect(fileMap.listenerCount('change')).toBe(0);
  expect(report).toHaveBeenCalledTimes(1);
  expect(() => injected!.dispose()).not.toThrow();
  expect(watcher.close).toHaveBeenCalledTimes(1);
});

test.each([false, true])(
  'keeps watching and notifying other listeners after a listener fails (async: %s)',
  async (asyncListener) => {
    vol.writeFileSync('/project/.env', 'A=1');
    const { watcher, notify } = mockNativeWatcher();
    injected = createWatcher({ watch: true });
    injected.onChange(() => {
      const error = new Error('onChange failed');
      if (asyncListener) return Promise.reject(error);
      throw error;
    });
    const listener = jest.fn();
    injected.onChange(listener);

    await expect(injected.ready).resolves.toBeUndefined();
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(watcher.close).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);

    vol.writeFileSync('/project/.env', 'A=longer');
    notify();
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(watcher.close).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(2);
  }
);

test.each([false, true])(
  'settles safely when the owner closes during discovery (rejects: %s)',
  async (rejects) => {
    vol.writeFileSync('/project/.env', 'A=1');
    let resolveDiscovery!: () => void;
    let rejectDiscovery!: (error: Error) => void;
    const discovery = new Promise<void>((resolve, reject) => {
      resolveDiscovery = resolve;
      rejectDiscovery = reject;
    });
    jest.spyOn(metro, 'ready').mockReturnValue(discovery);
    const watch = jest.spyOn(fs, 'watch');
    const report = jest.mocked(debugEvent);
    const server = new EventEmitter() as unknown as Server;
    injected = injectMetroFileMapWatcher({ metro, server }, config, {
      files: ['.env'],
      watch: true,
    });
    server.emit('close');
    if (rejects) rejectDiscovery(new Error('discovery failed after close'));
    else resolveDiscovery();
    await expect(injected.ready).resolves.toBeUndefined();
    expect(watch).not.toHaveBeenCalled();
    expect(tree.getAllFiles()).toEqual([]);
    expect(fileMap.listenerCount('change')).toBe(0);
    expect(report).not.toHaveBeenCalled();
    expect(() => injected!.dispose()).not.toThrow();
  }
);

test.each(['metro', 'watcher'] as const)(
  'contains live insertion failures from %s after readiness',
  async (source) => {
    jest.useFakeTimers();
    vol.writeFileSync('/project/.env', 'A=1');
    const { watcher, notify } = mockNativeWatcher();
    const report = jest.mocked(debugEvent);
    injected = createWatcher({ watch: true });
    await injected.ready;
    jest.spyOn(tree, 'addOrModify').mockImplementation(() => {
      throw new Error('live insert failed');
    });
    vol.writeFileSync('/project/.env', 'A=longer');
    expect(() => {
      if (source === 'metro')
        fileMap.emit('change', {
          rootDir: '/project',
          changes: {
            addedDirectories: new Set(),
            removedDirectories: new Set(),
            addedFiles: new Map(),
            modifiedFiles: new Map(),
            removedFiles: new Map(),
          },
        });
      else {
        notify();
        jest.runOnlyPendingTimers();
      }
    }).not.toThrow();
    expect(report).toHaveBeenCalledTimes(1);
    expect(watcher.close).toHaveBeenCalledTimes(1);
    expect(fileMap.listenerCount('change')).toBe(0);
  }
);

test('silently skips an uninspectable optional file and discovers other candidates', async () => {
  vol.fromJSON({ '/project/.env': 'A=1', '/project/.env.local': 'B=1' });
  const report = jest.mocked(debugEvent);
  jest.spyOn(fs, 'lstatSync').mockImplementationOnce(() => {
    throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
  });
  injected = createWatcher({ files: ['.env', '.env.local'] });
  await injected.ready;
  expect(tree.getAllFiles()).toEqual(['/project/.env.local']);
  expect(report).not.toHaveBeenCalled();
});

test('preserves unrelated Metro batches when targets have not changed', async () => {
  vol.writeFileSync('/project/.env', 'A=1');
  injected = createWatcher();
  await injected.ready;
  const listener = jest.fn();
  injected.onChange(listener);
  const changes: ChangeEvent['changes'] = {
    addedDirectories: new Set(),
    removedDirectories: new Set(),
    addedFiles: new Map(),
    modifiedFiles: new Map([['index.js', { modifiedTime: 1, isSymlink: false }]]),
    removedFiles: new Map(),
  };
  const event: ChangeEvent = { rootDir: '/project', logger: undefined, changes };
  fileMap.emit('change', event);
  expect(event.changes).toBe(changes);
  expect(listener).not.toHaveBeenCalled();
});

test.each(['metro', 'watcher'] as const)(
  'preserves additions when Metro indexes a new target before the %s notification',
  async (source) => {
    jest.useFakeTimers();
    const { notify } = mockNativeWatcher();
    injected = createWatcher({ watch: true });
    const listener = jest.fn();
    injected.onChange(listener);
    await injected.ready;

    vol.writeFileSync('/project/.env', 'A=1');
    const stat = fs.lstatSync('/project/.env');
    tree.addOrModify('.env', [stat.mtimeMs, stat.size, 0, null, 0, null]);
    const event: ChangeEvent = {
      rootDir: '/project',
      logger: undefined,
      changes: {
        addedDirectories: new Set(),
        removedDirectories: new Set(),
        addedFiles: new Map([['.env', { modifiedTime: stat.mtimeMs, isSymlink: false }]]),
        modifiedFiles: new Map(),
        removedFiles: new Map(),
      },
    };

    if (source === 'metro') fileMap.emit('change', event);
    else {
      notify();
      jest.runOnlyPendingTimers();
    }

    expect(listener).toHaveBeenCalledTimes(1);
    expect([...listener.mock.calls[0]![0].changes.addedFiles].map(([file]) => file)).toEqual([
      '.env',
    ]);
    expect([...listener.mock.calls[0]![0].changes.modifiedFiles]).toEqual([]);

    if (source === 'watcher') fileMap.emit('change', event);
    expect(listener).toHaveBeenCalledTimes(1);
  }
);

test('skips symlink targets and injects a candidate if it becomes a regular file', async () => {
  jest.useFakeTimers();
  vol.fromJSON({ '/project/shared/values': 'A=linked' });
  vol.symlinkSync('shared/values', '/project/.env');
  const lookup = jest.spyOn(tree, 'lookup');
  const { notify } = mockNativeWatcher();
  const listener = jest.fn();
  injected = createWatcher({ watch: true });
  injected.onChange(listener);
  await injected.ready;

  expect(lookup).not.toHaveBeenCalled();
  expect(tree.getAllFiles()).toEqual([]);
  expect(listener).not.toHaveBeenCalled();

  vol.unlinkSync('/project/.env');
  vol.writeFileSync('/project/.env', 'A=regular');
  notify();
  jest.runOnlyPendingTimers();
  expect(tree.exists('.env')).toBe(true);
  expect([...listener.mock.calls[0]![0].changes.addedFiles].map(([file]) => file)).toEqual([
    '.env',
  ]);
});
