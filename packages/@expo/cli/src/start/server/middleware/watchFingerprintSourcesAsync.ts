import { getMetroServerRoot } from '@expo/config/paths';
import type { HashSource } from '@expo/fingerprint';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import type { RuntimePlatform } from './resolvePlatform';

/**
 * Upper bound of directories to watch. Each watched directory uses one OS watch handle (an inotify
 * watch on Linux), and above this the watcher gives up rather than risk exhausting the system limit.
 * This only happens with presets hashing whole packages (`nativeModuleSourceType: 'files'`).
 */
const MAX_WATCHED_DIRECTORIES = 2000;

/** Slack for file systems that store coarse timestamps, such as HFS+ (1s) and FAT (2s). */
const MTIME_TOLERANCE_MS = 2000;

/** Fingerprint's ignore patterns (`Minimatch` objects), passed back to `isIgnoredPathWithMatchObjects`. */
type MatchObjects = unknown[];

/** The parts of `@expo/fingerprint` that decide which paths are hashed. */
interface FingerprintModule {
  normalizeOptionsAsync(
    projectRoot: string,
    options: { silent?: boolean; platforms?: RuntimePlatform[]; ignorePaths?: string[] }
  ): Promise<{ ignorePathMatchObjects: MatchObjects; ignoreDirMatchObjects: MatchObjects }>;
  isIgnoredPathWithMatchObjects(filePath: string, matchObjects: MatchObjects): boolean;
}

export interface FingerprintSourcesWatcher {
  close(): void;
}

/**
 * Watch the files and directories a fingerprint was created from, and call `onChange` once when any
 * of them may have changed. The watcher closes itself after the first change or error.
 *
 * Only paths that `@expo/fingerprint` hashes are watched. Directories it ignores, such as `ios/Pods`,
 * `ios/build`, and `android/app/build`, are never walked, so build outputs don't use up OS watch
 * handles. Changes that can alter hashed contents without being a hashed path themselves, such as
 * the app config, `package.json`, `.env` files, `fingerprint.config.js`, `.fingerprintignore`, or
 * lockfiles, are caught by watching the project and workspace roots.
 *
 * @returns `null` when a source changed after `changedSinceMs`, which means the resolved runtime
 * version may already be outdated.
 * @throws when the sources can't be watched, for example when the system ran out of watch handles.
 */
export async function watchFingerprintSourcesAsync(
  projectRoot: string,
  {
    platform,
    sources,
    workflow,
    changedSinceMs,
    onChange,
    onError,
  }: {
    platform: RuntimePlatform;
    /** The sources expo-updates hashed into the fingerprint. */
    sources: HashSource[];
    workflow: 'managed' | 'generic';
    /** When the runtime version started resolving. Changes after this make the result outdated. */
    changedSinceMs: number;
    onChange: () => void;
    onError: (error: Error) => void;
  },
  {
    watch = fs.watch,
    loadFingerprint = loadProjectFingerprint,
    maxWatchedDirectories = MAX_WATCHED_DIRECTORIES,
  }: {
    watch?: typeof fs.watch;
    loadFingerprint?: (projectRoot: string) => FingerprintModule;
    maxWatchedDirectories?: number;
  } = {}
): Promise<FingerprintSourcesWatcher | null> {
  const fingerprint = loadFingerprint(projectRoot);
  // `fingerprint.config.js` is loaded with `require`, so drop a stale copy from an earlier resolution.
  for (const configFile of ['fingerprint.config.js', 'fingerprint.config.cjs']) {
    delete require.cache[path.join(projectRoot, configFile)];
  }
  const { ignorePathMatchObjects, ignoreDirMatchObjects } = await fingerprint.normalizeOptionsAsync(
    projectRoot,
    {
      silent: true,
      platforms: [platform],
      // Matches expo-updates, which ignores the native directories of managed projects.
      ignorePaths: workflow === 'managed' ? ['android/**/*', 'ios/**/*'] : undefined,
    }
  );
  const isIgnored = (absolutePath: string, matchObjects: MatchObjects) =>
    fingerprint.isIgnoredPathWithMatchObjects(
      path.relative(projectRoot, absolutePath).split(path.sep).join('/'),
      matchObjects
    );

  const serverRoot = getMetroServerRoot(projectRoot);
  // Directories where any change counts.
  const rootDirs = new Set([projectRoot, serverRoot]);
  // Directories inside `dir` sources, where changes to ignored paths don't count.
  const sourceDirs = new Set<string>();
  // Files whose timestamps are compared with `changedSinceMs`.
  const files = new Set<string>();

  const assertWatchLimit = () => {
    if (rootDirs.size + sourceDirs.size > maxWatchedDirectories) {
      throw new Error(
        `The fingerprint sources span more than ${maxWatchedDirectories} directories.`
      );
    }
  };

  const addSourceDirAsync = async (dir: string) => {
    if (sourceDirs.has(dir) || isIgnored(dir, ignoreDirMatchObjects)) {
      return;
    }
    sourceDirs.add(dir);
    assertWatchLimit();
    for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      // Matches `@expo/fingerprint`, which skips nested node_modules and symlinks when hashing a directory.
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        await addSourceDirAsync(entryPath);
      } else if (entry.isFile() && !isIgnored(entryPath, ignorePathMatchObjects)) {
        files.add(entryPath);
      }
    }
  };

  try {
    for (const source of sources) {
      // Contents sources are derived from the app config and autolinking, see the root directories.
      if (source.type === 'contents') {
        continue;
      }
      const sourcePath = path.resolve(projectRoot, source.filePath);
      if (source.type === 'dir') {
        rootDirs.add(path.dirname(sourcePath));
        await addSourceDirAsync(sourcePath);
      } else if (source.type === 'package') {
        // Only the package's `name` and `version` are hashed. Watch its directory for changes to
        // `package.json`, and each parent up to `node_modules` for packages being added or removed.
        files.add(sourcePath);
        let dir = path.dirname(sourcePath);
        rootDirs.add(dir);
        while (path.basename(dir) !== 'node_modules' && path.dirname(dir) !== dir) {
          dir = path.dirname(dir);
          rootDirs.add(dir);
        }
      } else {
        files.add(sourcePath);
        rootDirs.add(path.dirname(sourcePath));
      }
    }
    // The app config, package.json, .env files, fingerprint config, and lockfiles live in the roots.
    for (const rootDir of new Set([projectRoot, serverRoot])) {
      for (const entry of await fs.promises.readdir(rootDir, { withFileTypes: true })) {
        if (entry.isFile()) {
          files.add(path.join(rootDir, entry.name));
        }
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // A source disappeared since it was hashed.
      return null;
    }
    throw error;
  }
  assertWatchLimit();

  const watchers: fs.FSWatcher[] = [];
  let isClosed = false;
  const close = () => {
    if (!isClosed) {
      isClosed = true;
      for (const watcher of watchers) {
        watcher.close();
      }
    }
  };

  try {
    for (const dir of new Set([...rootDirs, ...sourceDirs])) {
      const isSourceDir = !rootDirs.has(dir);
      const watcher = watch(dir, { persistent: false }, (_event, filename) => {
        if (isClosed) {
          return;
        }
        if (isSourceDir && filename) {
          const changedPath = path.join(dir, filename.toString());
          if (
            isIgnored(changedPath, ignorePathMatchObjects) ||
            isIgnored(changedPath, ignoreDirMatchObjects)
          ) {
            return;
          }
        }
        close();
        onChange();
      });
      watchers.push(watcher);
      watcher.on('error', (error) => {
        if (!isClosed) {
          close();
          onError(error);
        }
      });
    }
  } catch (error: any) {
    close();
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }

  // Changes made after the resolution started, but before the watchers started, don't emit events.
  // Compare timestamps instead, and treat a missing path as a change.
  const changedAfterMs = changedSinceMs - MTIME_TOLERANCE_MS;
  for (const filePath of [...rootDirs, ...sourceDirs, ...files]) {
    const stats = await fs.promises.stat(filePath).catch(() => null);
    if (!stats || stats.mtimeMs >= changedAfterMs) {
      close();
      return null;
    }
  }

  return { close };
}

/**
 * Load the `@expo/fingerprint` copy that expo-updates uses through `expo/fingerprint`, so the watched
 * paths follow the same ignore rules as the fingerprint itself.
 */
function loadProjectFingerprint(projectRoot: string): FingerprintModule {
  const expoPackageJson = resolveFrom(projectRoot, 'expo/package.json');
  const fingerprintRoot = path.dirname(
    resolveFrom(path.dirname(expoPackageJson), '@expo/fingerprint/package.json')
  );
  const { normalizeOptionsAsync } = require(path.join(fingerprintRoot, 'build/Options'));
  const { isIgnoredPathWithMatchObjects } = require(path.join(fingerprintRoot, 'build/utils/Path'));
  return { normalizeOptionsAsync, isIgnoredPathWithMatchObjects };
}
