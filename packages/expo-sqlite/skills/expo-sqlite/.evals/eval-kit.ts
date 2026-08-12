/**
 * Thin vitest adapter for agent evals — the piece that moves to a shared
 * package (so case files only change their import path). `agentEval()` wraps
 * `describe()`: a beforeAll hook seeds a temp workspace from the case's
 * local/ files, runs the coding agent with the case's prompt, and each
 * `check()` becomes a `test()` receiving workspace helpers.
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
  /** All source files concatenated — for whole-workspace pattern checks. */
  source(): string;
  packageJson(): Record<string, any> | undefined;
}

export interface AgentEvalOptions {
  /** The task, written the way a real user asks. */
  prompt: string;
  /** The case's seed workspace, e.g. `new URL('./local/', import.meta.url)`. */
  localDir: URL | string;
}

type CheckContext = { skip: (note?: string) => void };
type CheckFn = (workspace: EvalWorkspace, ctx: CheckContext) => void | Promise<void>;
type DefineChecks = (check: (name: string, fn: CheckFn) => void) => void;

export function agentEval(name: string, options: AgentEvalOptions, defineChecks: DefineChecks) {
  const condition: Condition =
    process.env.EXPO_SKILL_EVAL_CONDITION === 'without-skill' ? 'without-skill' : 'with-skill';
  const timeoutSeconds = Number(process.env.EXPO_SKILL_EVAL_TIMEOUT ?? 900);

  describe(`${name} [${condition}]`, () => {
    let workspace: EvalWorkspace;

    beforeAll(
      async () => {
        const root = seedWorkspace(options.localDir, condition);
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

function seedWorkspace(localDir: URL | string, condition: Condition): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-sqlite-eval-'));
  fs.cpSync(localDir instanceof URL ? fileURLToPath(localDir) : localDir, root, {
    recursive: true,
  });

  // Resolve the expo-sqlite under test to this package, not the registry.
  const packageJsonPath = path.join(root, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.dependencies?.['expo-sqlite']) {
    packageJson.dependencies['expo-sqlite'] = `file:${PACKAGE_ROOT}`;
  }
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  if (condition === 'with-skill') {
    // Copy of the layout `npx expo skills` links for claude-code.
    fs.cpSync(SKILL_ROOT, path.join(root, '.claude', 'skills', SKILL_LINK_NAME), {
      recursive: true,
      filter: (source) => !source.includes(`${path.sep}.evals`),
    });
  }
  return root;
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
        .map((f) => f.contents)
        .join('\n'),
    packageJson: () => {
      try {
        return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
      } catch {
        return undefined;
      }
    },
  };
}
