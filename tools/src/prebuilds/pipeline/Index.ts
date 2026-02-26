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

/**
 * Install SIGINT/SIGTERM handlers that set `ctx.cancelled = true`
 * so the executor can bail out gracefully at the next step boundary.
 */
export function installSignalHandlers(ctx: PrebuildContext): () => void {
  const handler = () => {
    ctx.cancelled = true;
  };

  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);

  return () => {
    process.removeListener('SIGINT', handler);
    process.removeListener('SIGTERM', handler);
  };
}
