/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { FileChange, WatchProjectResponse } from 'fb-watchman';
import watchman from 'fb-watchman';
import invariant from 'invariant';
import * as path from 'path';
import { performance } from 'perf_hooks';

import { planQuery } from './planQuery';
import { RootPathUtils } from '../../lib/RootPathUtils';
import isVcsPath from '../../lib/isVcsPath';
import normalizePathSeparatorsToPosix from '../../lib/normalizePathSeparatorsToPosix';
import normalizePathSeparatorsToSystem from '../../lib/normalizePathSeparatorsToSystem';
import type {
  WatchmanClockSpec,
  CanonicalPath,
  CrawlerOptions,
  CrawlResult,
  FileData,
  FileMetadata,
  Path,
} from '../../types';

// NOTE(@kitten): Not exported by @types/fb-watchman
interface WatchmanWatchResponse extends WatchProjectResponse {
  watcher: string;
}

// NOTE(@kitten): Not exported by @types/fb-watchman
interface WatchmanQueryResponse {
  clock: string | { clock: string };
  is_fresh_instance: boolean;
  files: FileChange[];
  warning?: string;
}

/** Posix-separated absolute path as key */
type WatchmanRoots = Map<string, { readonly directoryFilters: string[]; readonly watcher: string }>;

const WATCHMAN_WARNING_INITIAL_DELAY_MILLISECONDS = 10000;
const WATCHMAN_WARNING_INTERVAL_MILLISECONDS = 20000;

const watchmanURL = 'https://facebook.github.io/watchman/docs/troubleshooting';

function makeWatchmanError(error: Error): Error {
  error.message =
    `Watchman error: ${error.message.trim()}. Make sure watchman ` +
    `is running for this project. See ${watchmanURL}.`;
  return error;
}

export default async function watchmanCrawl({
  abortSignal,
  computeSha1,
  extensions,
  ignore,
  includeSymlinks,
  onStatus,
  perfLogger,
  previousState,
  rootDir,
  roots,
}: CrawlerOptions): Promise<CrawlResult> {
  abortSignal?.throwIfAborted();

  const client = new watchman.Client();
  const pathUtils = new RootPathUtils(rootDir);
  abortSignal?.addEventListener('abort', () => client.end());

  perfLogger?.point('watchmanCrawl_start');

  const newClocks = new Map<Path, WatchmanClockSpec>();

  let clientError: Error | undefined;
  client.on('error', (error: Error) => {
    clientError = makeWatchmanError(error);
  });

  // TODO: Fix to use fb-watchman types
  const cmd = async <T>(command: 'watch-project' | 'query', ...args: any[]): Promise<T> => {
    let didLogWatchmanWaitMessage = false;
    const startTime = performance.now();
    const logWatchmanWaitMessage = () => {
      didLogWatchmanWaitMessage = true;
      onStatus({
        type: 'watchman_slow_command',
        timeElapsed: performance.now() - startTime,
        command,
      });
    };
    let intervalOrTimeoutId: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> =
      setTimeout(() => {
        logWatchmanWaitMessage();
        intervalOrTimeoutId = setInterval(
          logWatchmanWaitMessage,
          WATCHMAN_WARNING_INTERVAL_MILLISECONDS
        );
      }, WATCHMAN_WARNING_INITIAL_DELAY_MILLISECONDS);
    try {
      const response = await new Promise<WatchmanQueryResponse>((resolve, reject) => {
        // NOTE: dynamic call of command
        return (client.command as Function)(
          [command, ...args],
          (error: Error | null, result: WatchmanQueryResponse) =>
            error ? reject(makeWatchmanError(error)) : resolve(result)
        );
      });
      if ('warning' in response) {
        onStatus({
          type: 'watchman_warning',
          warning: response.warning,
          command,
        });
      }
      return response as unknown as T;
    } finally {
      // NOTE: clearInterval / clearTimeout are interchangeable
      clearInterval(intervalOrTimeoutId);
      if (didLogWatchmanWaitMessage) {
        onStatus({
          type: 'watchman_slow_command_complete',
          timeElapsed: performance.now() - startTime,
          command,
        });
      }
    }
  };

  async function getWatchmanRoots(roots: readonly Path[]): Promise<WatchmanRoots> {
    perfLogger?.point('watchmanCrawl/getWatchmanRoots_start');
    const watchmanRoots: WatchmanRoots = new Map();
    await Promise.all(
      roots.map(async (root, index) => {
        perfLogger?.point(`watchmanCrawl/watchProject_${index}_start`);
        const response = await cmd<WatchmanWatchResponse>('watch-project', root);
        perfLogger?.point(`watchmanCrawl/watchProject_${index}_end`);
        const existing = watchmanRoots.get(response.watch);
        // A root can only be filtered if it was never seen with a
        // relative_path before.
        const canBeFiltered = !existing || existing.directoryFilters.length > 0;

        if (canBeFiltered) {
          if (response.relative_path) {
            watchmanRoots.set(response.watch, {
              watcher: response.watcher,
              directoryFilters: (existing?.directoryFilters || []).concat(response.relative_path),
            });
          } else {
            // Make the filter directories an empty array to signal that this
            // root was already seen and needs to be watched for all files or
            // directories.
            watchmanRoots.set(response.watch, {
              watcher: response.watcher,
              directoryFilters: [],
            });
          }
        }
      })
    );
    perfLogger?.point('watchmanCrawl/getWatchmanRoots_end');
    return watchmanRoots;
  }

  async function queryWatchmanForDirs(rootProjectDirMappings: WatchmanRoots) {
    perfLogger?.point('watchmanCrawl/queryWatchmanForDirs_start');
    const results = new Map<string, WatchmanQueryResponse>();
    let isFresh = false;

    await Promise.all(
      Array.from(rootProjectDirMappings).map(
        async ([posixSeparatedRoot, { directoryFilters, watcher }], index) => {
          // Jest is only going to store one type of clock; a string that
          // represents a local clock. However, the Watchman crawler supports
          // a second type of clock that can be written by automation outside of
          // Jest, called an "scm query", which fetches changed files based on
          // source control mergebases. The reason this is necessary is because
          // local clocks are not portable across systems, but scm queries are.
          // By using scm queries, we can create the haste map on a different
          // system and import it, transforming the clock into a local clock.
          const since = previousState.clocks.get(
            normalizePathSeparatorsToPosix(
              pathUtils.absoluteToNormal(normalizePathSeparatorsToSystem(posixSeparatedRoot))
            )
          );

          perfLogger?.annotate({
            bool: {
              [`watchmanCrawl/query_${index}_has_clock`]: since != null,
            },
          });

          const { query, queryGenerator } = planQuery({
            since,
            extensions,
            directoryFilters,
            includeSha1: computeSha1,
            includeSymlinks,
          });

          perfLogger?.annotate({
            string: {
              [`watchmanCrawl/query_${index}_watcher`]: watcher ?? 'unknown',
              [`watchmanCrawl/query_${index}_generator`]: queryGenerator,
            },
          });

          perfLogger?.point(`watchmanCrawl/query_${index}_start`);
          const response = await cmd<WatchmanQueryResponse>('query', posixSeparatedRoot, query);
          perfLogger?.point(`watchmanCrawl/query_${index}_end`);

          // When a source-control query is used, we ignore the "is fresh"
          // response from Watchman because it will be true despite the query
          // being incremental.
          const isSourceControlQuery =
            typeof since !== 'string' && since?.scm?.['mergebase-with'] != null;
          if (!isSourceControlQuery) {
            isFresh = isFresh || response.is_fresh_instance;
          }

          results.set(posixSeparatedRoot, response);
        }
      )
    );

    perfLogger?.point('watchmanCrawl/queryWatchmanForDirs_end');

    return {
      isFresh,
      results,
    };
  }

  let removedFiles: Set<CanonicalPath> = new Set();
  let changedFiles: FileData = new Map();
  let results: Map<string, WatchmanQueryResponse> | undefined;
  let isFresh = false;
  let queryError: Error | undefined;
  try {
    const watchmanRoots = await getWatchmanRoots(roots);
    const watchmanFileResults = await queryWatchmanForDirs(watchmanRoots);
    results = watchmanFileResults.results;
    isFresh = watchmanFileResults.isFresh;
  } catch (e: any) {
    queryError = e;
  }
  client.end();

  if (results == null) {
    if (clientError) {
      perfLogger?.annotate({
        string: {
          'watchmanCrawl/client_error': clientError.message ?? '[message missing]',
        },
      });
    }
    if (queryError) {
      perfLogger?.annotate({
        string: {
          'watchmanCrawl/query_error': queryError.message ?? '[message missing]',
        },
      });
    }
    perfLogger?.point('watchmanCrawl_end');
    abortSignal?.throwIfAborted();
    throw queryError ?? clientError ?? new Error('Watchman file results missing');
  }

  perfLogger?.point('watchmanCrawl/processResults_start');

  const freshFileData: FileData = new Map();

  for (const [watchRoot, response] of results) {
    const fsRoot = normalizePathSeparatorsToSystem(watchRoot);
    const relativeFsRoot = pathUtils.absoluteToNormal(fsRoot);
    newClocks.set(
      normalizePathSeparatorsToPosix(relativeFsRoot),
      // Ensure we persist only the local clock.
      typeof response.clock === 'string' ? response.clock : response.clock.clock
    );

    for (const fileData of response.files) {
      const filePath = fsRoot + path.sep + normalizePathSeparatorsToSystem(fileData.name);
      const relativeFilePath = pathUtils.absoluteToNormal(filePath);

      if (!fileData.exists) {
        if (!isFresh) {
          removedFiles.add(relativeFilePath);
        }
        // Whether watchman can return exists: false in a fresh instance
        // response is unknown, but there's nothing we need to do in that case.
      } else if (!isVcsPath(fileData.name) && !ignore(filePath)) {
        const { mtime_ms, size } = fileData;
        invariant(mtime_ms != null && size != null, 'missing file data in watchman response');
        const mtime = typeof mtime_ms === 'number' ? mtime_ms : mtime_ms.toNumber();

        let sha1hex: string | undefined = fileData['content.sha1hex'];
        if (typeof sha1hex !== 'string' || sha1hex.length !== 40) {
          sha1hex = undefined;
        }

        let symlinkInfo: 0 | 1 | string = 0;
        if (fileData.type === 'l') {
          symlinkInfo = fileData['symlink_target'] ?? 1;
        }
        if (typeof symlinkInfo === 'string') {
          symlinkInfo = normalizePathSeparatorsToPosix(
            pathUtils.resolveSymlinkToNormal(relativeFilePath, symlinkInfo)
          );
        }

        const nextData: FileMetadata = [mtime, size, 0, sha1hex ?? null, symlinkInfo, null];

        // If watchman is fresh, the removed files map starts with all files
        // and we remove them as we verify they still exist.
        if (isFresh) {
          freshFileData.set(relativeFilePath, nextData);
        } else {
          changedFiles.set(relativeFilePath, nextData);
        }
      }
    }
  }

  if (isFresh) {
    ({ changedFiles, removedFiles } = previousState.fileSystem.getDifference(freshFileData));
  }

  perfLogger?.point('watchmanCrawl/processResults_end');
  perfLogger?.point('watchmanCrawl_end');
  abortSignal?.throwIfAborted();
  return {
    changedFiles,
    removedFiles,
    clocks: newClocks,
  };
}
