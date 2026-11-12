import type { HashSource } from '@expo/fingerprint';
import { EventEmitter } from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { watchFingerprintSourcesAsync } from '../watchFingerprintSourcesAsync';

// These tests use the real file system and the real fingerprint ignore rules.
jest.unmock('fs');
jest.unmock('fs/promises');
jest.unmock('os');
jest.unmock('child_process');
jest.mock('@expo/spawn-async', () => jest.requireActual('@expo/spawn-async'));

const loadFingerprint = () => ({
  normalizeOptionsAsync: jest.requireActual('@expo/fingerprint/build/Options')
    .normalizeOptionsAsync,
  isIgnoredPathWithMatchObjects: jest.requireActual('@expo/fingerprint/build/utils/Path')
    .isIgnoredPathWithMatchObjects,
});

class FakeWatcher extends EventEmitter {
  close = jest.fn();
  constructor(
    public dir: string,
    public listener: (event: string, filename: string | null) => void
  ) {
    super();
  }
}

/** Records watched directories instead of watching them. */
function createFakeWatch() {
  const watchers: FakeWatcher[] = [];
  const watch = jest.fn((dir: string, _options: object, listener: any) => {
    const watcher = new FakeWatcher(dir, listener);
    watchers.push(watcher);
    return watcher;
  });
  return { watchers, watch: watch as unknown as typeof fs.watch };
}

let projectRoot: string;

function writeFiles(files: Record<string, string>) {
  for (const [file, contents] of Object.entries(files)) {
    const filePath = path.join(projectRoot, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, contents);
  }
}

/** Moves every timestamp into the past, so nothing looks changed since the resolution started. */
function backdate(dir = projectRoot) {
  const past = new Date(Date.now() - 60 * 60 * 1000);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      backdate(entryPath);
    }
    fs.utimesSync(entryPath, past, past);
  }
  fs.utimesSync(dir, past, past);
}

function relativeDirs(watchers: FakeWatcher[]) {
  return watchers.map((watcher) => path.relative(projectRoot, watcher.dir) || '.').sort();
}

const iosDirSource: HashSource = { type: 'dir', filePath: 'ios', reasons: ['bareNativeDir'] };

beforeEach(() => {
  projectRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fingerprint-watch-')));
  writeFiles({
    'package.json': JSON.stringify({ name: 'app' }),
    'app.json': JSON.stringify({ expo: { name: 'app' } }),
    'ios/Podfile': '',
    'ios/.xcode.env.local': '',
    'ios/App/AppDelegate.swift': '',
    'ios/App/Generated/Thing.swift': '',
    'ios/App.xcodeproj/project.pbxproj': '',
    'ios/App/node_modules/nested/index.js': '',
    'ios/Pods/Manifest.lock': '',
    'ios/Pods/Target/File.m': '',
    'ios/build/Build/Products/App.app/App': '',
  });
});

afterEach(() => {
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

function watchAsync(
  options: Partial<Parameters<typeof watchFingerprintSourcesAsync>[1]> = {},
  overrides: Parameters<typeof watchFingerprintSourcesAsync>[2] = {}
) {
  return watchFingerprintSourcesAsync(
    projectRoot,
    {
      platform: 'ios',
      sources: [iosDirSource],
      workflow: 'generic',
      changedSinceMs: Date.now(),
      onChange: jest.fn(),
      onError: jest.fn(),
      ...options,
    },
    { loadFingerprint, ...overrides }
  );
}

describe(watchFingerprintSourcesAsync, () => {
  it('watches native source directories but not build outputs or nested node_modules', async () => {
    backdate();
    const { watch, watchers } = createFakeWatch();

    await expect(watchAsync({}, { watch })).resolves.not.toBeNull();

    expect(relativeDirs(watchers)).toEqual([
      '.',
      'ios',
      'ios/App',
      'ios/App.xcodeproj',
      'ios/App/Generated',
    ]);
  });

  it('skips directories ignored by .fingerprintignore', async () => {
    writeFiles({ '.fingerprintignore': 'ios/App/Generated/**/*\n' });
    backdate();
    const { watch, watchers } = createFakeWatch();

    await watchAsync({}, { watch });

    expect(relativeDirs(watchers)).toEqual(['.', 'ios', 'ios/App', 'ios/App.xcodeproj']);
  });

  it('does not descend into the native directories of a managed project', async () => {
    backdate();
    const { watch, watchers } = createFakeWatch();

    await watchAsync({ workflow: 'managed' }, { watch });

    // The project root watch still reports the native directory being added or removed.
    expect(relativeDirs(watchers)).toEqual(['.']);
  });

  it('watches the package directory and node_modules for package and file sources', async () => {
    writeFiles({
      'node_modules/@scope/native-module/package.json': '{"name":"@scope/native-module"}',
      'plugins/withThing.js': '',
    });
    backdate();
    const { watch, watchers } = createFakeWatch();

    await watchAsync(
      {
        sources: [
          {
            type: 'package',
            name: '@scope/native-module',
            version: '1.0.0',
            filePath: 'node_modules/@scope/native-module/package.json',
            reasons: ['expoAutolinkingIos'],
          },
          { type: 'file', filePath: 'plugins/withThing.js', reasons: ['expoConfigPlugins'] },
          { type: 'contents', id: 'expoConfig', contents: '{}', reasons: ['expoConfig'] },
        ],
      },
      { watch }
    );

    expect(relativeDirs(watchers)).toEqual([
      '.',
      'node_modules',
      'node_modules/@scope',
      'node_modules/@scope/native-module',
      'plugins',
    ]);
  });

  it('reports changes to sources and to the project root, but not to ignored paths', async () => {
    backdate();
    const { watch, watchers } = createFakeWatch();
    const onChange = jest.fn();
    await watchAsync({ onChange }, { watch });
    const watcherFor = (dir: string) =>
      watchers.find((w) => w.dir === path.join(projectRoot, dir))!;

    watcherFor('ios').listener('change', '.xcode.env.local');
    watcherFor('ios').listener('rename', 'Pods');
    watcherFor('ios').listener('rename', 'build');
    expect(onChange).not.toHaveBeenCalled();

    watcherFor('ios/App').listener('change', 'AppDelegate.swift');
    expect(onChange).toHaveBeenCalledTimes(1);
    // The watcher closes itself after the first change.
    expect(watchers.every((watcher) => watcher.close.mock.calls.length === 1)).toBe(true);

    watcherFor('.').listener('change', 'app.json');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('reports a change to any file in the project root', async () => {
    backdate();
    const { watch, watchers } = createFakeWatch();
    const onChange = jest.fn();
    await watchAsync({ onChange }, { watch });

    // app.json is in the fingerprint's ignore paths, because it is hashed as config contents instead.
    watchers.find((w) => w.dir === projectRoot)!.listener('change', 'app.json');

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('reports a native file change through the real file system watcher', async () => {
    backdate();
    const changed = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('No change reported')), 5000);
      watchAsync({
        onChange: () => {
          clearTimeout(timeout);
          resolve();
        },
      }).then((watcher) => {
        expect(watcher).not.toBeNull();
        fs.appendFileSync(path.join(projectRoot, 'ios/App/AppDelegate.swift'), '// edit\n');
      }, reject);
    });

    await expect(changed).resolves.toBeUndefined();
  });

  it('returns null when a source changed while the runtime version was resolving', async () => {
    backdate();
    const changedSinceMs = Date.now();
    fs.appendFileSync(path.join(projectRoot, 'ios/App.xcodeproj/project.pbxproj'), '// edit\n');
    const { watch, watchers } = createFakeWatch();

    await expect(watchAsync({ changedSinceMs }, { watch })).resolves.toBeNull();
    expect(watchers.every((watcher) => watcher.close.mock.calls.length === 1)).toBe(true);
  });

  it('returns null when a source directory disappeared', async () => {
    backdate();
    const watch = jest.fn(() => {
      throw Object.assign(new Error('no such file or directory'), { code: 'ENOENT' });
    }) as unknown as typeof fs.watch;

    await expect(watchAsync({}, { watch })).resolves.toBeNull();
  });

  it('throws and closes its watchers when a watcher cannot start', async () => {
    backdate();
    const { watch: fakeWatch, watchers } = createFakeWatch();
    let calls = 0;
    const watch = jest.fn((...args: Parameters<typeof fs.watch>) => {
      if (++calls === 3) {
        throw Object.assign(new Error('System limit for number of file watchers reached'), {
          code: 'ENOSPC',
        });
      }
      return fakeWatch(...args);
    }) as unknown as typeof fs.watch;

    await expect(watchAsync({}, { watch })).rejects.toThrow('System limit');
    expect(watchers).toHaveLength(2);
    expect(watchers.every((watcher) => watcher.close.mock.calls.length === 1)).toBe(true);
  });

  it('throws when the sources span too many directories', async () => {
    backdate();
    const { watch, watchers } = createFakeWatch();

    await expect(watchAsync({}, { watch, maxWatchedDirectories: 3 })).rejects.toThrow(
      /more than 3 directories/
    );
    expect(watchers).toHaveLength(0);
  });

  it('reports watcher errors after it started', async () => {
    backdate();
    const { watch, watchers } = createFakeWatch();
    const onError = jest.fn();
    const onChange = jest.fn();
    await watchAsync({ onError, onChange }, { watch });

    const error = new Error('watcher failed');
    watchers[1]!.emit('error', error);

    expect(onError).toHaveBeenCalledWith(error);
    expect(onChange).not.toHaveBeenCalled();
    expect(watchers.every((watcher) => watcher.close.mock.calls.length === 1)).toBe(true);
  });

  it('closes every watcher', async () => {
    backdate();
    const { watch, watchers } = createFakeWatch();

    const watcher = await watchAsync({}, { watch });
    watcher!.close();

    expect(watchers.every((w) => w.close.mock.calls.length === 1)).toBe(true);
  });

  it('throws when @expo/fingerprint cannot be loaded from the project', async () => {
    backdate();
    const loadFingerprint = () => {
      throw Object.assign(new Error("Cannot find module 'expo/package.json'"), {
        code: 'MODULE_NOT_FOUND',
      });
    };

    await expect(watchAsync({}, { loadFingerprint })).rejects.toThrow('Cannot find module');
  });
});
