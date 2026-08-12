/**
 * Thin vitest adapter for agent evals. This file is package-agnostic by
 * design — it is the piece that moves to a shared package, at which point it
 * shrinks to a re-export shim. Package-specific configuration lives in
 * setup.ts, which imports nothing from this file: its `setupProject()`
 * returns a plain descriptor that case files pass as `projectSetup`.
 *
 * `agentEval()` wraps `describe()`: a beforeAll hook builds a temp workspace
 * (a cached `bunx create-expo-app` scaffold + the case's named fixtures),
 * runs the coding agent with the case's prompt, and each `check()` becomes a
 * `test()` receiving workspace helpers.
 *
 * The case id is derived from the eval filename (`003-drop-async-storage.eval.ts`
 * → `003-drop-async-storage`), so it can never drift from what's on disk; the
 * optional `title` adds prose to reports.
 *
 * Semantics preserved from the four-status check model:
 * - `skip(note)` inside a check = not_applicable — the check's precondition
 *   doesn't hold, and a clean pass would be absence of usage, not evidence of
 *   correct usage. Vitest reports it as skipped, never as passed.
 * - A failed agent run throws in beforeAll, erroring the whole suite —
 *   an infrastructure failure must not be scored as check results.
 *
 * Environment:
 * - EXPO_SKILL_EVAL_CONDITION: 'with-skill' (default) | 'without-skill'
 * - EXPO_SKILL_EVAL_DRY: '1' scores the untouched seed without running the
 *   agent — checks should fail; use it to verify a new case can't be passed
 *   by its own seed.
 * - EXPO_SKILL_EVAL_MODEL: model passed to the agent (e.g. 'claude-sonnet-5');
 *   the agent CLI's default when unset
 * - EXPO_SKILL_EVAL_TIMEOUT: agent timeout in seconds (default 900)
 * - EXPO_SKILL_EVAL_KEEP: '1' keeps workspaces for inspection
 */
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, test } from 'vitest';

export { expect } from 'vitest';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

/**
 * Everything the kit needs to build one case's project, produced by the
 * package's setup.ts `setupProject()` builder — package facts (which package
 * is under test, where the skill and fixtures live) merged with the case's
 * starting state. A plain object: setup.ts never imports this file, it just
 * returns a structurally compatible value.
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

export type Condition = 'with-skill' | 'without-skill';

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
  /** The case's project, built by setup.ts's `setupProject()`. */
  projectSetup: ProjectSetup;
}

type CheckContext = { skip: (note?: string) => void };
type CheckFn = (workspace: EvalWorkspace, ctx: CheckContext) => void | Promise<void>;
type DefineChecks = (check: (name: string, fn: CheckFn) => void) => void;

export function agentEval(
  caseUrl: string,
  options: AgentEvalOptions,
  defineChecks: DefineChecks
): void {
  const setup = options.projectSetup;
  const packageRoot = toPath(setup.packageRoot);
  const skillDir = toPath(setup.skillDir);
  const fixturesDir = toPath(setup.fixturesDir);
  // Mirrors the link name `npx expo skills` creates for the package's skill.
  const skillLinkName = `npm-${setup.packageName.replace(/^@/, '').replace(/\//g, '-')}-${path.basename(skillDir)}`;
  const baseTemplate = setup.baseTemplate ?? 'blank-typescript';

  const id = path.basename(fileURLToPath(caseUrl)).replace(/\.eval\.tsx?$/, '');
  const condition: Condition =
    process.env.EXPO_SKILL_EVAL_CONDITION === 'without-skill' ? 'without-skill' : 'with-skill';
  const timeoutSeconds = Number(process.env.EXPO_SKILL_EVAL_TIMEOUT ?? 900);
  const name = options.title ? `${id} — ${options.title}` : id;

  describe(`${name} [${condition}]`, () => {
    let workspace: EvalWorkspace;

    beforeAll(
      async () => {
        const scaffold = await scaffoldBaseAppAsync(baseTemplate);
        const root = seedWorkspace(scaffold);
        await setup.prepareAsync?.({
          root,
          condition,
          runAsync: (command, args, runOptions) =>
            runCommandAsync(root, command, args, runOptions?.timeoutSeconds ?? 600),
        });
        // Last word on the dependency: the package under test always
        // resolves to the local checkout, whatever preparation installed.
        linkPackageUnderTest(root);
        if (condition === 'with-skill') {
          // Copy of the layout `npx expo skills` links for claude-code.
          fs.cpSync(skillDir, path.join(root, '.claude', 'skills', skillLinkName), {
            recursive: true,
            filter: (source) => !source.includes(`${path.sep}.evals`),
          });
        }
        if (process.env.EXPO_SKILL_EVAL_DRY !== '1') {
          await runAgentAsync(root, options.prompt, timeoutSeconds, skillLinkName);
        }
        workspace = createWorkspace(root, condition);
      },
      (timeoutSeconds + 300) * 1000
    );

    afterAll(() => {
      if (workspace && process.env.EXPO_SKILL_EVAL_KEEP !== '1') {
        fs.rmSync(workspace.root, { recursive: true, force: true });
      }
    });

    defineChecks((checkName, fn) => {
      test(checkName, async (t) => {
        await fn(workspace, {
          skip: (note) => t.skip(note ?? 'not applicable'),
        });
      });
    });
  });

  function seedWorkspace(scaffold: string): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-skill-eval-'));
    fs.cpSync(scaffold, root, { recursive: true });

    for (const fixture of [setup.fixture ?? []].flat()) {
      const fixtureRoot = path.join(fixturesDir, fixture);
      if (!fs.existsSync(fixtureRoot)) {
        throw new Error(`Unknown fixture '${fixture}' — expected directory ${fixtureRoot}`);
      }
      fs.cpSync(fixtureRoot, root, { recursive: true });
    }
    for (const [relativePath, contents] of Object.entries(setup.files ?? {})) {
      const absolutePath = path.join(root, relativePath);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, contents);
    }

    // The scaffold's package.json + the seed's extra dependencies.
    const packageJsonPath = path.join(root, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...setup.dependencies,
      [setup.packageName]: '*',
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    return root;
  }

  /** Resolves the package under test to the local checkout, not the registry. */
  function linkPackageUnderTest(root: string) {
    const packageJsonPath = path.join(root, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.dependencies = {
      ...packageJson.dependencies,
      [setup.packageName]: `file:${packageRoot}`,
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  }
}

/** Runs a command inside a workspace, capturing output; throws on non-zero exit. */
async function runCommandAsync(
  root: string,
  command: string,
  args: string[],
  timeoutSeconds: number
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`${command} ${args.join(' ')} timed out after ${timeoutSeconds}s`));
    }, timeoutSeconds * 1000);
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`${command} ${args.join(' ')} exited with ${code}:\n${output.slice(-4000)}`)
        );
      }
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`Could not run ${command}: ${error}`));
    });
  });
}

/**
 * Scaffolds the base app once per template with `bunx create-expo-app`
 * (network on the first run) and caches it; later runs copy the cache.
 * Vitest runs suites in parallel workers and concurrent `bunx
 * create-expo-app` invocations collide in bun's link step, so a
 * cross-process lock (atomic mkdir) serializes scaffolding: the winner
 * builds the cache, the others wait for it.
 */
async function scaffoldBaseAppAsync(template: string): Promise<string> {
  const cacheDir = path.join(os.tmpdir(), `expo-skill-eval-base-${template}`);
  const isReady = () => fs.existsSync(path.join(cacheDir, 'package.json'));
  if (isReady()) {
    return cacheDir;
  }

  const lockDir = `${cacheDir}.lock`;
  for (;;) {
    if (isReady()) {
      return cacheDir;
    }
    try {
      fs.mkdirSync(lockDir);
      break;
    } catch {
      // Steal locks left behind by a crashed process.
      const age =
        Date.now() - (fs.statSync(lockDir, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
      if (age > 5 * 60_000) {
        fs.rmSync(lockDir, { recursive: true, force: true });
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  try {
    if (isReady()) {
      return cacheDir;
    }
    await scaffoldIntoCacheAsync(template, cacheDir);
    return cacheDir;
  } finally {
    fs.rmSync(lockDir, { recursive: true, force: true });
  }
}

async function scaffoldIntoCacheAsync(template: string, cacheDir: string): Promise<void> {
  const stagingDir = `${cacheDir}-staging-${process.pid}`;
  fs.rmSync(stagingDir, { recursive: true, force: true });
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'bunx',
      ['create-expo-app@latest', stagingDir, '--template', template, '--no-install'],
      {
        env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`bunx create-expo-app exited with ${code} (is bun installed?):\n${output}`)
          )
    );
    child.on('error', (error) => reject(new Error(`Could not run bunx: ${error}`)));
  });
  fs.rmSync(path.join(stagingDir, '.git'), { recursive: true, force: true });
  fs.rmSync(path.join(stagingDir, 'node_modules'), { recursive: true, force: true });
  fs.renameSync(stagingDir, cacheDir);
}

async function runAgentAsync(
  root: string,
  prompt: string,
  timeoutSeconds: number,
  skillLinkName: string
) {
  const transcriptPath = path.join(root, '.eval', 'transcript.jsonl');
  fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
  const transcript = fs.createWriteStream(transcriptPath);

  // A nested CLAUDECODE env var makes `claude -p` hang silently.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== 'CLAUDECODE')
  ) as NodeJS.ProcessEnv;

  const args = [
    '-p',
    prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
  ];
  const model = process.env.EXPO_SKILL_EVAL_MODEL;
  if (model) {
    args.push('--model', model);
  }

  const exit = await new Promise<{ code: number | null; timedOut: boolean }>((resolve) => {
    const child = spawn('claude', args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ code: null, timedOut: true });
    }, timeoutSeconds * 1000);
    child.stdout.pipe(transcript);
    child.stderr.pipe(transcript);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, timedOut: false });
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      transcript.write(`\nharness error: ${error}\n`);
      resolve({ code: -1, timedOut: false });
    });
  });
  transcript.end();

  // Infrastructure failure: error the suite instead of scoring an untouched
  // workspace, which would report FAILs the agent never earned.
  if (exit.timedOut || exit.code !== 0) {
    throw new Error(
      exit.timedOut
        ? `Agent run timed out after ${timeoutSeconds}s — transcript: ${transcriptPath}`
        : `Agent run failed (claude exited with ${exit.code}) — transcript: ${transcriptPath}`
    );
  }

  const skillWasRead = fs.readFileSync(transcriptPath, 'utf8').includes(skillLinkName);
  console.info(`agent finished; skill ${skillWasRead ? 'was' : 'was NOT'} read`);
}

function createWorkspace(root: string, condition: Condition): EvalWorkspace {
  let cachedSources: { path: string; contents: string }[] | null = null;
  const sourceFiles = () => {
    if (!cachedSources) {
      cachedSources = [];
      const visit = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
            continue;
          }
          const absolutePath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            visit(absolutePath);
          } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
            cachedSources.push({
              path: path.relative(root, absolutePath),
              contents: fs.readFileSync(absolutePath, 'utf8'),
            });
          }
        }
      };
      visit(root);
    }
    return cachedSources;
  };

  return {
    root,
    condition,
    read: (relativePath) => {
      try {
        return fs.readFileSync(path.join(root, relativePath), 'utf8');
      } catch {
        return '';
      }
    },
    exists: (relativePath) => fs.existsSync(path.join(root, relativePath)),
    sourceFiles,
    source: () =>
      sourceFiles()
        .map((f) => stripComments(f.contents))
        .join('\n'),
    packageJson: () => {
      try {
        return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
      } catch {
        return undefined;
      }
    },
    glob: (pattern) =>
      fs
        .globSync(pattern, { cwd: root })
        .filter(
          (match) =>
            !match.split(path.sep).some((part) => part === 'node_modules' || part.startsWith('.'))
        )
        .sort(),
  };
}

function toPath(location: URL | string): string {
  return location instanceof URL || String(location).startsWith('file:')
    ? fileURLToPath(location)
    : String(location);
}

/**
 * Strips // and /* *\/ comments while leaving string and template contents
 * intact, so lexical checks scan only live code. Mirrors the comment-stripped
 * scan the expo eval-experiments harness runs its lexical checks on.
 */
export function stripComments(code: string): string {
  let result = '';
  let state: 'code' | 'line' | 'block' | 'single' | 'double' | 'template' = 'code';
  for (let i = 0; i < code.length; i++) {
    const pair = code.slice(i, i + 2);
    const char = code[i];
    switch (state) {
      case 'code':
        if (pair === '//') {
          state = 'line';
          i++;
        } else if (pair === '/*') {
          state = 'block';
          i++;
        } else {
          if (char === "'") state = 'single';
          else if (char === '"') state = 'double';
          else if (char === '`') state = 'template';
          result += char;
        }
        break;
      case 'line':
        if (char === '\n') {
          state = 'code';
          result += char;
        }
        break;
      case 'block':
        if (pair === '*/') {
          state = 'code';
          i++;
        } else if (char === '\n') {
          result += char;
        }
        break;
      case 'single':
      case 'double':
      case 'template': {
        result += char;
        const terminator = state === 'single' ? "'" : state === 'double' ? '"' : '`';
        if (char === '\\') {
          result += code[++i] ?? '';
        } else if (char === terminator || (state !== 'template' && char === '\n')) {
          state = 'code';
        }
        break;
      }
    }
  }
  return result;
}

export interface AstSupport {
  /** Parses TypeScript/JSX source into a Babel AST. */
  parse(code: string, filename: string): any;
  /** Depth-first walk over every node in the tree (plain recursion, no @babel/traverse). */
  walk(node: any, visit: (node: any) => void): void;
}

/**
 * AST checks are opt-in: they need `@babel/parser`, declared in the evals
 * directory's package.json but not vendored. Returns null when it isn't
 * installed — the calling check should `skip()` (evidence unavailable must
 * never read as compliance), pointing at `npm install` in the evals directory.
 */
export async function loadAstSupport(): Promise<AstSupport | null> {
  let parser: any;
  try {
    parser = await import('@babel/parser');
  } catch {
    return null;
  }
  const walk = (node: any, visit: (node: any) => void) => {
    if (!node || typeof node.type !== 'string') {
      return;
    }
    visit(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const item of value) walk(item, visit);
      } else if (value && typeof value === 'object') {
        walk(value, visit);
      }
    }
  };
  return {
    parse: (code, filename) =>
      parser.parse(code, {
        sourceType: 'module',
        sourceFilename: filename,
        plugins: ['typescript', 'jsx'],
      }),
    walk,
  };
}
