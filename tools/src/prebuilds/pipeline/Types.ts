/**
 * Core types for the prebuild pipeline.
 *
 * Defines the step contract, status model, and run result used by all
 * pipeline modules (Executor, RunSteps, PackageSteps, ProductSteps, Reporter).
 */

// ---------------------------------------------------------------------------
// Status & stage enums
// ---------------------------------------------------------------------------

export type StageStatus = 'success' | 'failed' | 'skipped' | 'warning';

export type ProductStage = 'generate' | 'build' | 'compose' | 'verify';

/**
 * Controls what happens when a step fails:
 *  - `stop-run`       → abort the entire run immediately
 *  - `skip-remaining` → skip remaining steps for the current unit, continue with next
 *  - `continue`       → record the error but keep running subsequent steps
 */
export type ErrorPolicy = 'stop-run' | 'skip-remaining' | 'continue';

// ---------------------------------------------------------------------------
// Step contract
// ---------------------------------------------------------------------------

export type StepScope = 'run' | 'package' | 'product';

export interface Step<TContext> {
  /** Unique identifier (e.g. "prepare:inputs", "build") */
  id: string;

  /** Which loop level this step belongs to */
  scope: StepScope;

  /** Human-readable label for logging (defaults to id) */
  label?: string;

  /** Return false to skip this step for the given context */
  shouldRun: (ctx: TContext) => boolean;

  /** Execute the step. Throw to signal failure. */
  run: (ctx: TContext) => Promise<void>;

  /** What to do when `run` throws */
  onError: ErrorPolicy;
}

// ---------------------------------------------------------------------------
// Per-unit tracking
// ---------------------------------------------------------------------------

export interface UnitStatus {
  packageName: string;
  productName: string;
  flavor: string;
  /** Composite key: `${packageName}/${productName}[${flavor}]` */
  unitId: string;
  stages: Record<ProductStage, StageStatus>;
  elapsedMs: number;
  /**
   * Set when a unit was skipped because of an upstream DAG failure. The value
   * is a human-readable reason (e.g., `"dependency react-native-worklets failed"`).
   * When present, the unit is rendered as a single-line skip in the summary
   * and counted as a failure, independent of its per-stage statuses.
   */
  skipReason?: string;
}

export interface UnitError {
  packageName: string;
  productName: string;
  flavor: string;
  unitId: string;
  stage: ProductStage | 'clean' | 'prepare';
  error: Error;
}

// ---------------------------------------------------------------------------
// Run result
// ---------------------------------------------------------------------------

export interface PrebuildRunResult {
  exitCode: number;
  elapsedMs: number;
  statuses: UnitStatus[];
  errors: UnitError[];
  errorLogPath?: string;
}
