import type FileMap from '@expo/metro-file-map';
import type { ChangeEvent } from '@expo/metro-file-map';
import type { MutableFileSystem } from '@expo/metro-file-map/build/types';
import type { ConfigT } from '@expo/metro/metro-config';
import type MetroServer from '@expo/metro/metro/Server';
import fs from 'node:fs';
import type { Server } from 'node:http';
import path from 'node:path';

import { composeMetroIgnorePatterns } from '../../../../utils/composeMetroIgnorePatterns';
import { debugEvent } from '../metroDebugEvents';

export type MetroFileMapWatcherListener = (event: ChangeEvent) => void | Promise<void>;

export interface MetroFileMapWatcher {
  readonly ready: Promise<void>;
  onChange(listener: MetroFileMapWatcherListener): () => void;
  dispose(): void;
}

/** Add candidate files to Metro's file map and emit synchronized events when they change. */
export function injectMetroFileMapWatcher(
  { metro, server }: { metro: MetroServer; server: Server },
  config: ConfigT,
  {
    files,
    watch,
  }: {
    files: readonly string[];
    watch: boolean;
  }
): MetroFileMapWatcher {
  const injectedEvent = Symbol('injectedChange');
  type WatcherChangeEvent = ChangeEvent & { [injectedEvent]?: true };

  const rootDir = config.projectRoot;
  const targets = new Map<string, string>();
  const stats = new Map<string, fs.Stats>();
  const stopWatching = new Set<() => void>();
  const listeners = new Set<MetroFileMapWatcherListener>();

  let fileMap: FileMap;
  let fileSystem: MutableFileSystem;
  let stopped = false;
  let pending: ReturnType<typeof setImmediate> | undefined;
  let initialFiles: Set<string> | undefined = new Set();

  function hasTargets(changes: ChangeEvent['changes']): boolean {
    for (const [file] of changes.addedFiles ?? []) {
      if (targets.has(file)) return true;
    }
    for (const [file] of changes.modifiedFiles ?? []) {
      if (targets.has(file)) return true;
    }
    for (const [file] of changes.removedFiles ?? []) {
      if (targets.has(file)) return true;
    }
    return false;
  }

  function synchronize(batch?: ChangeEvent['changes']) {
    const createChanges = () =>
      ({
        addedDirectories: batch?.addedDirectories ?? new Set<string>(),
        removedDirectories: batch?.removedDirectories ?? new Set<string>(),
        addedFiles: new Map(batch?.addedFiles),
        modifiedFiles: new Map(batch?.modifiedFiles),
        removedFiles: new Map(batch?.removedFiles),
      }) satisfies ChangeEvent['changes'];

    let changes = batch && !hasTargets(batch) ? undefined : createChanges();

    for (const [normalPath, absolutePath] of targets) {
      const previous = stats.get(normalPath);
      let stat: fs.Stats | undefined;
      try {
        stat = fs.lstatSync(absolutePath);
      } catch {}

      // Leave symlinks and directories to Metro without resolving link targets.
      // Only inspect the map to remove an injected file that became a directory.
      if (stat && !stat.isFile()) {
        const indexed =
          stat.isDirectory() && previous != null ? fileSystem.lookup(normalPath) : null;
        const indexedSymlink =
          indexed?.exists && indexed.type === 'f' ? indexed.metadata[4] : undefined;
        if (indexedSymlink !== 0) {
          stats.delete(normalPath);
          continue;
        }

        stat = undefined;
      }

      if (!stat && !previous) continue;

      // Metro may report the same file; derive its change from our last snapshot.
      changes?.addedFiles.delete(normalPath);
      changes?.modifiedFiles.delete(normalPath);
      changes?.removedFiles.delete(normalPath);

      if (stat) {
        const changed =
          !previous ||
          stat.mtimeMs !== previous.mtimeMs ||
          stat.ctimeMs !== previous.ctimeMs ||
          stat.size !== previous.size ||
          stat.ino !== previous.ino;
        const exists = fileSystem.exists(absolutePath);

        if (changed || !exists) {
          // Leave hashes and derived metadata unset for Metro to compute lazily.
          fileSystem.addOrModify(normalPath, [stat.mtimeMs, stat.size, 0, null, 0, null]);
          if (!exists) initialFiles?.add(normalPath);
        }

        if (changed) {
          changes ??= createChanges();

          // Metro may already have indexed a new file before either watcher reports it.
          const isModification = previous != null || (initialFiles !== undefined && exists);
          const entry = { modifiedTime: stat.mtimeMs, isSymlink: false };
          (isModification ? changes.modifiedFiles : changes.addedFiles).set(normalPath, entry);
        }

        stats.set(normalPath, stat);
      } else if (previous) {
        fileSystem.remove(normalPath);
        changes ??= createChanges();
        changes.removedFiles.set(normalPath, {
          modifiedTime: previous.mtimeMs,
          isSymlink: false,
        });
        stats.delete(normalPath);
      }
    }

    return changes;
  }

  // A Metro recrawl can drop injected files because they still fail its extension filter.
  // Restore them and merge any real target changes into this batch before Metro's consumers run.
  const reconcile = (event: WatcherChangeEvent) => {
    if (!stopped && !event[injectedEvent]) {
      try {
        const changes = synchronize(event.changes);
        if (changes) {
          (event as { changes: ChangeEvent['changes'] }).changes = changes;
        }
      } catch (error) {
        handleFailure(error);
      }
    }
  };

  const notify = (event: ChangeEvent) => {
    if (listeners.size && hasTargets(event.changes)) {
      for (const listener of listeners) {
        try {
          Promise.resolve(listener(event)).catch((error) => reportError(error, 'listener'));
        } catch (error) {
          reportError(error, 'listener');
        }
      }
    }
  };

  function emit(changes: ReturnType<typeof synchronize>) {
    // Even empty Metro change batches invalidate caches and trigger HMR.
    if (
      changes &&
      (changes.addedFiles.size || changes.modifiedFiles.size || changes.removedFiles.size)
    ) {
      // The tree already reflects this batch; the marker skips our own reconciliation.
      const event: WatcherChangeEvent = {
        rootDir,
        logger: undefined,
        changes,
        [injectedEvent]: true,
      };
      try {
        fileMap.emit('change', event);
      } catch (error) {
        reportError(error, 'listener');
      }
    }
  }

  const refresh = () => {
    if (!pending && !stopped) {
      pending = setImmediate(() => {
        pending = undefined;
        try {
          emit(synchronize());
        } catch (error) {
          handleFailure(error);
        }
      });
    }
  };

  function startWatching(): void {
    const directories = new Map<string, Set<string>>();
    for (const file of targets.values()) {
      const directory = path.dirname(file);
      const names = directories.get(directory) ?? new Set<string>();
      names.add(path.basename(file));
      directories.set(directory, names);
    }
    for (const [directory, names] of directories) {
      watchDirectory(directory, names);
    }
  }

  function watchDirectory(directory: string, names: ReadonlySet<string>): void {
    let close = () => {};
    let polling = false;
    stopWatching.add(() => close());

    const poll = () => {
      if (polling || stopped) return;

      polling = true;
      close();

      const files = [...names].map((name) => path.join(directory, name));
      close = () => files.forEach((file) => fs.unwatchFile(file, refresh));
      for (const file of files) fs.watchFile(file, { persistent: false, interval: 500 }, refresh);
      refresh();
    };

    try {
      // Watching the parent survives atomic file replacement.
      const watcher = fs.watch(directory, { persistent: false }, (_event, filename) => {
        if (filename == null || names.has(filename.toString())) refresh();
      });
      close = () => watcher.close();
      watcher.on('error', poll);
    } catch {
      poll();
    }
  }

  async function initialize(): Promise<void> {
    const ignored = composeMetroIgnorePatterns(config.resolver.blockList);

    // Match Metro's absolute-path exclusions and root-relative file keys.
    for (const file of files) {
      const absolutePath = path.resolve(rootDir, file);
      ignored.lastIndex = 0;
      if (!ignored.test(absolutePath)) {
        targets.set(path.relative(rootDir, absolutePath), absolutePath);
      }
    }

    if (!targets.size) return;

    server.once('close', dispose);

    // Wait until Metro has registered its graph change listeners.
    await metro.ready();

    fileMap = metro.getBundler().getBundler().getWatcher() as unknown as FileMap;

    // build() returns the memoized filesystem without starting another crawl.
    const result = await fileMap.build();
    if (stopped) return;

    fileSystem = result.fileSystem as MutableFileSystem;
    fileMap.prependListener('change', reconcile);
    // Our subscribers observe the reconciled event after Metro's existing consumers.
    fileMap.on('change', notify);

    if (watch) startWatching();

    const changes = synchronize();
    // Commit before notifying Metro so a throwing listener cannot roll back its tree.
    initialFiles = undefined;
    emit(changes);
  }

  const dispose = () => {
    if (stopped) return;
    stopped = true;
    server.removeListener('close', dispose);

    if (pending) clearImmediate(pending);

    for (const stop of stopWatching) stop();
    stopWatching.clear();

    fileMap?.removeListener('change', reconcile);
    fileMap?.removeListener('change', notify);
    listeners.clear();
  };

  function reportError(error: unknown, source: 'watcher' | 'listener'): void {
    try {
      debugEvent('file_map_watcher_error', { source, error: debugEvent.error(error) });
    } catch {}
  }

  function handleFailure(error: unknown): void {
    if (stopped) return;

    // Readiness is intentionally ignored by callers, so failure cleanup must not reject it.
    try {
      dispose();
      for (const file of initialFiles ?? []) fileSystem.remove(file);
      initialFiles = undefined;
    } catch {}

    reportError(error, 'watcher');
  }

  return {
    ready: initialize().catch(handleFailure),
    onChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose,
  };
}
