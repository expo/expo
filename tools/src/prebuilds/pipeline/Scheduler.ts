/**
 * DAG-aware parallel scheduler for package builds.
 *
 * Launches packages with no unmet dependencies up to the concurrency limit,
 * then waits for any to finish before launching newly-unblocked packages.
 * Respects an AbortController for cancellation on stop-run errors.
 */
import type { SPMPackageSource } from '../ExternalPackage';
import type { UnitError, UnitStatus } from './Types';

export interface PackageResult {
  packageName: string;
  statuses: UnitStatus[];
  errors: UnitError[];
  /** True if a stop-run error occurred — triggers global abort. */
  stopRun: boolean;
}

type ExecutePackageFn = (
  pkg: SPMPackageSource,
  signal: AbortSignal,
  /**
   * Names of upstream DAG dependencies that failed or were themselves skipped.
   * When non-empty, the executor should short-circuit without running build
   * steps and synthesize a "skipped due to failed dependency" result.
   */
  failedDeps?: string[]
) => Promise<PackageResult>;

/**
 * Runs packages in parallel, respecting the dependency DAG and concurrency limit.
 *
 * - Packages whose dependencies have all completed are eligible to start.
 * - At most `concurrency` packages run simultaneously.
 * - If any package returns `stopRun: true`, the abort controller is triggered
 *   and no new packages are launched (in-flight packages finish naturally).
 */
export async function runPackagesInParallel(
  packages: SPMPackageSource[],
  dependsOn: Map<string, Set<string>>,
  concurrency: number,
  abortController: AbortController,
  executePackage: ExecutePackageFn
): Promise<PackageResult[]> {
  if (packages.length === 0) {
    return [];
  }

  const results: PackageResult[] = [];
  const completed = new Set<string>();
  // Transitively poisoned — failed packages + packages skipped because of an
  // upstream failure. Used to short-circuit dependents.
  const failedOrDoomed = new Set<string>();

  // Build in-degree map (count of unfinished dependencies)
  const inDegree = new Map<string, number>();
  for (const pkg of packages) {
    const deps = dependsOn.get(pkg.packageName);
    inDegree.set(pkg.packageName, deps ? deps.size : 0);
  }

  // Package lookup
  const packageMap = new Map<string, SPMPackageSource>();
  for (const pkg of packages) {
    packageMap.set(pkg.packageName, pkg);
  }

  // Build reverse dependency map: packageName -> packages that depend on it
  const dependedOnBy = new Map<string, string[]>();
  for (const [pkgName, deps] of dependsOn) {
    for (const dep of deps) {
      let list = dependedOnBy.get(dep);
      if (!list) {
        list = [];
        dependedOnBy.set(dep, list);
      }
      list.push(pkgName);
    }
  }

  // Ready queue: packages with in-degree 0
  const readyQueue: SPMPackageSource[] = [];
  for (const pkg of packages) {
    if ((inDegree.get(pkg.packageName) ?? 0) === 0) {
      readyQueue.push(pkg);
    }
  }

  // In-flight promises, keyed by package name for removal
  const running = new Map<string, Promise<{ name: string; result: PackageResult }>>();

  while (readyQueue.length > 0 || running.size > 0) {
    // Launch ready packages up to concurrency limit (unless aborted)
    while (readyQueue.length > 0 && running.size < concurrency && !abortController.signal.aborted) {
      const pkg = readyQueue.shift()!;
      const failedDeps = [...(dependsOn.get(pkg.packageName) ?? [])].filter((d) =>
        failedOrDoomed.has(d)
      );
      const promise = executePackage(
        pkg,
        abortController.signal,
        failedDeps.length > 0 ? failedDeps : undefined
      ).then((result) => ({ name: pkg.packageName, result }));
      running.set(pkg.packageName, promise);
    }

    if (running.size === 0) {
      break;
    }

    // Wait for any one package to finish
    const { name, result } = await Promise.race(running.values());
    running.delete(name);
    results.push(result);
    completed.add(name);
    if (result.errors.length > 0) {
      failedOrDoomed.add(name);
    }

    // If stop-run, abort and drain remaining
    if (result.stopRun) {
      abortController.abort();
      // Let in-flight packages finish (they check signal.aborted at step boundaries)
      if (running.size > 0) {
        const remaining = await Promise.allSettled(running.values());
        for (const settled of remaining) {
          if (settled.status === 'fulfilled') {
            results.push(settled.value.result);
          }
        }
      }
      break;
    }

    // Unblock dependent packages
    const dependents = dependedOnBy.get(name) ?? [];
    for (const depName of dependents) {
      const degree = (inDegree.get(depName) ?? 1) - 1;
      inDegree.set(depName, degree);
      if (degree === 0) {
        const depPkg = packageMap.get(depName);
        if (depPkg) {
          readyQueue.push(depPkg);
        }
      }
    }
  }

  return results;
}
