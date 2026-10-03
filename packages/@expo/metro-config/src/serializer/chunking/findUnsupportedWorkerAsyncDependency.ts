import type { ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import { isResolvedDependency } from '@expo/metro/metro/lib/isResolvedDependency';

import type { AsyncDependencyType } from '../../transform-worker/collect-dependencies';

export function findUnsupportedWorkerAsyncDependency(
  entryFile: string,
  graph: ReadOnlyGraph
):
  | {
      workerEntry: string;
      importer: string;
      target: string;
      asyncType: 'async' | 'maybeSync' | 'prefetch';
    }
  | undefined {
  // A module can run in both realms, so visit page and worker dependencies separately.
  const pending: { modulePath: string; workerEntry?: string }[] = [{ modulePath: entryFile }];
  const visitedPages = new Set<string>();
  const visitedWorkers = new Set<string>();
  for (let index = 0; index < pending.length; index++) {
    const { modulePath, workerEntry } = pending[index]!;
    const visited = workerEntry === undefined ? visitedPages : visitedWorkers;
    if (visited.has(modulePath)) continue;
    visited.add(modulePath);
    const module = graph.dependencies.get(modulePath);
    if (!module) continue;
    for (const dependency of module.dependencies.values()) {
      const asyncType = dependency.data.data.asyncType as AsyncDependencyType | null;
      if (!isResolvedDependency(dependency) || asyncType === 'weak') continue;
      if (
        workerEntry !== undefined &&
        (asyncType === 'async' || asyncType === 'maybeSync' || asyncType === 'prefetch')
      ) {
        return {
          workerEntry,
          importer: modulePath,
          target: dependency.absolutePath,
          asyncType,
        };
      }
      pending.push({
        modulePath: dependency.absolutePath,
        workerEntry: asyncType === 'worker' ? dependency.absolutePath : workerEntry,
      });
    }
  }
  return undefined;
}
