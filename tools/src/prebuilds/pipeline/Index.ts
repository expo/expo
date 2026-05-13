/**
 * Prebuild pipeline entrypoint.
 *
 * Re-exports the public API and installs signal handling for graceful cancellation.
 */
import type { PrebuildContext } from './Context';

export { createRequest, createContext } from './Context';
export type { PrebuildCliOptions, PrebuildRequest, PrebuildContext } from './Context';

export { runPrebuildPipeline, executeStep } from './Executor';
export type { PipelineSteps } from './Executor';

export { runPackagesInParallel } from './Scheduler';
export type { PackageResult } from './Scheduler';

export { ArtifactLock } from './ArtifactLock';

export type {
  StageStatus,
  ProductStage,
  ErrorPolicy,
  Step,
  StepScope,
  UnitStatus,
  UnitError,
  PrebuildRunResult,
} from './Types';

export { logPackageBanner, printPrebuildSummary, writeErrorLog, formatDuration } from './Reporter';

export {
  sortPackagesByDependencies,
  expandWithUnbuiltDependencies,
  resolveFlavorTemplatedPath,
  CACHE_DEPS,
} from './RunSteps';
export type { TopologicalSortResult } from './RunSteps';

/**
 * Install SIGINT/SIGTERM handlers that set `ctx.cancelled = true`
 * and abort the controller so parallel in-flight packages also stop.
 */
export function installSignalHandlers(ctx: PrebuildContext): () => void {
  const handler = () => {
    ctx.cancelled = true;
    ctx.abortController.abort();
  };

  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);

  return () => {
    process.removeListener('SIGINT', handler);
    process.removeListener('SIGTERM', handler);
  };
}
