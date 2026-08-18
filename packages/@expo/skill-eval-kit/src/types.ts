export type Condition = 'with-skill' | 'without-skill';

/**
 * Everything the kit needs to build one case's project, produced by the
 * consuming package's setup.ts `setupProject()` builder — package facts
 * (which package is under test, where the skill and fixtures live) merged
 * with the case's starting state. A plain object: setup.ts never imports
 * this package, it just returns a structurally compatible value.
 */
export interface ProjectSetup {
  /** The npm package under test, e.g. 'expo-sqlite'. */
  packageName: string;
  /** Root of the package under test; its build is linked into every workspace. */
  packageRoot: URL | string;
  /** The skill directory to link for the with-skill condition. */
  skillDir: URL | string;
  /** Directory of named seed workspaces layered over the scaffold. */
  fixturesDir: URL | string;
  /** create-expo-app template for the base scaffold. @default 'blank-typescript' */
  baseTemplate?: string;
  /**
   * Named fixture directory(ies) under `fixturesDir`, layered in order over
   * the base scaffold. Fixtures hold app files only; declare dependency
   * changes through `dependencies` so they stay visible in the eval file.
   */
  fixture?: string | string[];
  /** Extra package.json dependencies merged into the scaffold's. */
  dependencies?: Record<string, string>;
  /** One-off files written over the fixtures, workspace-relative path → contents. */
  files?: Record<string, string>;
  /**
   * Package-specific preparation, run after seeding and before the agent —
   * e.g. `runAsync('npx', ['expo', 'install', 'expo-sqlite'])`. A non-zero
   * exit throws, erroring the suite (infrastructure, not a score). The kit
   * re-points the package under test at the local checkout afterwards, so
   * installs here provide realistic dependency resolution and node_modules
   * without replacing the code being tested.
   */
  prepareAsync?: (context: PrepareContext) => Promise<void>;
}

export interface PrepareContext {
  /** Absolute path to the workspace being prepared. */
  root: string;
  condition: Condition;
  /** Runs a command inside the workspace; throws (with output) on non-zero exit. */
  runAsync(command: string, args: string[], options?: { timeoutSeconds?: number }): Promise<void>;
}

/** What a check receives. Score what the agent produced, never what the case seeded. */
export interface EvalWorkspace {
  /** Absolute path to the agent's workspace. */
  root: string;
  condition: Condition;
  /** Reads a workspace-relative file, returning '' when missing. */
  read(relativePath: string): string;
  exists(relativePath: string): boolean;
  /** Every source file in the workspace, excluding node_modules and dot directories. */
  sourceFiles(): { path: string; contents: string }[];
  /**
   * All source files concatenated, with comments stripped — so commented-out
   * code can neither satisfy a positive pattern check nor trip a negative one.
   */
  source(): string;
  packageJson(): Record<string, any> | undefined;
  /**
   * Workspace-relative paths matching a glob (e.g. `src/db/migrations/*.ts`,
   * `app/**\/index.*`) — for directory-structure checks. Excludes node_modules
   * and dot directories.
   */
  glob(pattern: string): string[];
}

export interface AgentEvalOptions {
  /** Optional prose for reports; the id always comes from the eval filename. */
  title?: string;
  /** The task, written the way a real user asks. */
  prompt: string;
  /** The case's project, built by the consuming package's `setupProject()`. */
  projectSetup: ProjectSetup;
}

export type CheckContext = { skip: (note?: string) => void };
export type CheckFn = (workspace: EvalWorkspace, ctx: CheckContext) => void | Promise<void>;
export type DefineChecks = (check: (name: string, fn: CheckFn) => void) => void;
