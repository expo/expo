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
  const pendingPages = [entryFile];
  const visitedPages = new Set<string>();
  const pendingWorkers: { modulePath: string; workerEntry: string }[] = [];
  for (let index = 0; index < pendingPages.length; index++) {
    const modulePath = pendingPages[index]!;
    if (visitedPages.has(modulePath)) continue;
    visitedPages.add(modulePath);
    const module = graph.dependencies.get(modulePath);
    if (!module) continue;
    for (const dependency of module.dependencies.values()) {
      const asyncType = dependency.data.data.asyncType as AsyncDependencyType | null;
      if (!isResolvedDependency(dependency) || asyncType === 'weak') continue;
      if (asyncType === 'worker') {
        pendingWorkers.push({
          modulePath: dependency.absolutePath,
          workerEntry: dependency.absolutePath,
        });
      } else {
        pendingPages.push(dependency.absolutePath);
      }
    }
  }

  const visitedWorkers = new Set<string>();
  for (let index = 0; index < pendingWorkers.length; index++) {
    const { modulePath, workerEntry } = pendingWorkers[index]!;
    if (visitedWorkers.has(modulePath)) continue;
    visitedWorkers.add(modulePath);
    const module = graph.dependencies.get(modulePath);
    if (!module) continue;
    for (const dependency of module.dependencies.values()) {
      const asyncType = dependency.data.data.asyncType as AsyncDependencyType | null;
      if (!isResolvedDependency(dependency) || asyncType === 'weak') continue;
      if (asyncType === 'async' || asyncType === 'maybeSync' || asyncType === 'prefetch') {
        return {
          workerEntry,
          importer: modulePath,
          target: dependency.absolutePath,
          asyncType,
        };
      }
      pendingWorkers.push({
        modulePath: dependency.absolutePath,
        workerEntry: asyncType === 'worker' ? dependency.absolutePath : workerEntry,
      });
    }
  }
  return undefined;
}
