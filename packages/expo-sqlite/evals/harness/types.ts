/**
 * Check statuses follow the four-state model from Expo's skill-eval harness:
 * only `passed`/`failed` are scored. `not_applicable` means the check's
 * precondition doesn't hold for this workspace (a clean pass would be absence
 * of usage, not evidence of correct usage). `unavailable` means evidence could
 * not be collected (for example, typecheck without node_modules) — it must
 * never read as compliance.
 */
export type CheckStatus = 'passed' | 'failed' | 'not_applicable' | 'unavailable';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  notes?: string;
}

export interface ScoreResult {
  /** True when every scored (`passed`/`failed`) check passed and at least one check was scored. */
  passed: boolean;
  checks: CheckResult[];
}

export type Condition = 'with-skill' | 'without-skill';

export interface SourceFile {
  /** Workspace-relative path. */
  path: string;
  contents: string;
}

export interface GrepMatch {
  path: string;
  line: number;
  text: string;
}

export interface TypecheckResult {
  status: 'passed' | 'failed' | 'unavailable';
  output: string;
}

/** What an `EVAL.ts` scorer receives. Score what the agent produced, never what the harness seeded. */
export interface EvalContext {
  /** Absolute path to the agent's workspace. */
  workspace: string;
  condition: Condition;
  /** Reads a workspace-relative file, returning '' when missing. */
  read(relativePath: string): string;
  exists(relativePath: string): boolean;
  /** Every .ts/.tsx/.js/.jsx file in the workspace, excluding node_modules and dot directories. */
  sourceFiles(): SourceFile[];
  grep(pattern: RegExp): GrepMatch[];
  packageJson(): Record<string, any> | undefined;
  /** Runs `tsc --noEmit` in the workspace. `unavailable` when dependencies are not installed. */
  typecheck(): Promise<TypecheckResult>;
}

export type Scorer = (ctx: EvalContext) => Promise<ScoreResult>;

/** Builds a scored check from a boolean. */
export function check(name: string, passed: boolean, notes?: string): CheckResult {
  return { name, status: passed ? 'passed' : 'failed', notes };
}

/** Builds a `not_applicable` check — the precondition for this rule doesn't hold. */
export function notApplicable(name: string, notes?: string): CheckResult {
  return { name, status: 'not_applicable', notes };
}

/** Folds checks into a ScoreResult. Unscored statuses never count toward pass/fail. */
export function score(checks: CheckResult[]): ScoreResult {
  const scored = checks.filter((c) => c.status === 'passed' || c.status === 'failed');
  return {
    passed: scored.length > 0 && scored.every((c) => c.status === 'passed'),
    checks,
  };
}
