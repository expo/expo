/**
 * Prebuild pipeline entrypoint.
 *
 * Re-exports the public API and installs signal handling for graceful cancellation.
 */
export { createRequest, createContext } from './Context';
export type { PrebuildCliOptions, PrebuildRequest, PrebuildContext } from './Context';

export { runPrebuildPipeline } from './Executor';

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

export { printPrebuildSummary, writeErrorLog, formatDuration } from './Reporter';

export {
  sortPackagesByDependencies,
  expandWithUnbuiltDependencies,
  resolveFlavorTemplatedPath,
  CACHE_DEPS,
} from './RunSteps';

import type { PrebuildContext } from './Context';

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
