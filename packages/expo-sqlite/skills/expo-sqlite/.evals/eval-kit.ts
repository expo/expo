/**
 * Thin vitest adapter for agent evals — the piece that moves to a shared
 * package (so case files only change their import path). `agentEval()` wraps
 * `describe()`: a beforeAll hook builds a temp workspace (base fixture + the
 * case's inline seed), runs the coding agent with the case's prompt, and each
 * `check()` becomes a `test()` receiving workspace helpers.
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

const EVALS_ROOT = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(EVALS_ROOT, '..');
const PACKAGE_ROOT = path.resolve(EVALS_ROOT, '..', '..', '..');
/** Mirrors the link name `npx expo skills` creates for this package's skill. */
const SKILL_LINK_NAME = 'npm-expo-sqlite-expo-sqlite';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

/**
 * Named seed workspaces under fixtures/. Every workspace starts from
 * fixtures/blank (the complete app scaffold), with the case's named fixture(s)
 * layered on top — fixtures are real files, so they get syntax highlighting
 * and lint, can hold binary assets (e.g. a bundled .db), and can be shared
 * between cases.
 */
const FIXTURES_ROOT = path.join(EVALS_ROOT, 'fixtures');
const BASE_FIXTURE = 'blank';

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

export interface SeedOptions {
  /**
   * Named fixture directory(ies) under fixtures/, layered in order over the
   * blank base scaffold. Fixtures hold app files only; declare dependency
   * changes through `dependencies` so they stay visible in the eval file.
   */
  fixture?: string | string[];
  /** Extra package.json dependencies merged into the base fixture's. */
  dependencies?: Record<string, string>;
  /** One-off files written over the fixtures, workspace-relative path → contents. */
  files?: Record<string, string>;
}

export interface AgentEvalOptions {
  /** Optional prose for reports; the id always comes from the eval filename. */
  title?: string;
  /** The task, written the way a real user asks. */
  prompt: string;
  seed?: SeedOptions;
}

type CheckContext = { skip: (note?: string) => void };
type CheckFn = (workspace: EvalWorkspace, ctx: CheckContext) => void | Promise<void>;
type DefineChecks = (check: (name: string, fn: CheckFn) => void) => void;

/** `caseUrl` is the eval file's `import.meta.url`; the case id is its basename. */
export function agentEval(caseUrl: string, options: AgentEvalOptions, defineChecks: DefineChecks) {
  const id = path.basename(fileURLToPath(caseUrl)).replace(/\.eval\.tsx?$/, '');
  const condition: Condition =
    process.env.EXPO_SKILL_EVAL_CONDITION === 'without-skill' ? 'without-skill' : 'with-skill';
  const timeoutSeconds = Number(process.env.EXPO_SKILL_EVAL_TIMEOUT ?? 900);
  const name = options.title ? `${id} — ${options.title}` : id;

  describe(`${name} [${condition}]`, () => {
    let workspace: EvalWorkspace;

    beforeAll(
      async () => {
        const root = seedWorkspace(options.seed ?? {}, condition);
        if (process.env.EXPO_SKILL_EVAL_DRY !== '1') {
          await runAgentAsync(root, options.prompt, timeoutSeconds);
        }
        workspace = createWorkspace(root, condition);
      },
      (timeoutSeconds + 120) * 1000
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
}

function seedWorkspace(seed: SeedOptions, condition: Condition): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-sqlite-eval-'));

  const fixtures = [BASE_FIXTURE, seed.fixture ?? []].flat();
  for (const fixture of fixtures) {
    const fixtureRoot = path.join(FIXTURES_ROOT, fixture);
    if (!fs.existsSync(fixtureRoot)) {
      throw new Error(`Unknown fixture '${fixture}' — expected directory ${fixtureRoot}`);
    }
    fs.cpSync(fixtureRoot, root, { recursive: true });
  }
  for (const [relativePath, contents] of Object.entries(seed.files ?? {})) {
    writeWorkspaceFile(root, relativePath, contents);
  }

  // The blank fixture's package.json + the seed's extra dependencies, with the
  // expo-sqlite under test resolved to this package instead of the registry.
  const packageJsonPath = path.join(root, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.dependencies = {
    ...packageJson.dependencies,
    ...seed.dependencies,
    'expo-sqlite': `file:${PACKAGE_ROOT}`,
  };
  writeWorkspaceFile(root, 'package.json', JSON.stringify(packageJson, null, 2) + '\n');

  if (condition === 'with-skill') {
    // Copy of the layout `npx expo skills` links for claude-code.
    fs.cpSync(SKILL_ROOT, path.join(root, '.claude', 'skills', SKILL_LINK_NAME), {
      recursive: true,
      filter: (source) => !source.includes(`${path.sep}.evals`),
    });
  }
  return root;
}

function writeWorkspaceFile(root: string, relativePath: string, contents: string) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
}

async function runAgentAsync(root: string, prompt: string, timeoutSeconds: number) {
  const transcriptPath = path.join(root, '.eval', 'transcript.jsonl');
  fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
  const transcript = fs.createWriteStream(transcriptPath);

  // A nested CLAUDECODE env var makes `claude -p` hang silently.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== 'CLAUDECODE')
  ) as NodeJS.ProcessEnv;

  const exit = await new Promise<{ code: number | null; timedOut: boolean }>((resolve) => {
    const child = spawn(
      'claude',
      [
        '-p',
        prompt,
        '--output-format',
        'stream-json',
        '--verbose',
        '--dangerously-skip-permissions',
      ],
      { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] }
    );
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

  const skillWasRead = fs.readFileSync(transcriptPath, 'utf8').includes(SKILL_LINK_NAME);
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
 * AST checks are opt-in: they need `@babel/parser`, declared in this
 * directory's package.json but not vendored. Returns null when it isn't
 * installed — the calling check should `skip()` (evidence unavailable must
 * never read as compliance), pointing at `npm install` in `.evals/`.
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
