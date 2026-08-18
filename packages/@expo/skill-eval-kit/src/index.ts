/**
 * Vitest harness for agent skill evals colocated with Expo packages.
 *
 * A consuming package keeps a hidden `.evals/` directory inside its skill:
 * flat `*.eval.ts` case files (prompt + fixture reference + checks together),
 * a `fixtures/` directory of seed workspaces, and a `setup.ts` whose
 * `setupProject()` returns a plain `ProjectSetup` descriptor — setup.ts
 * imports nothing from this package; the contract is structural.
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
 * Semantics from the four-status check model:
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
 * - EXPO_SKILL_EVAL_MODEL: model passed to the agent
 *   (default 'claude-sonnet-5')
 * - EXPO_SKILL_EVAL_TIMEOUT: agent timeout in seconds (default 900)
 * - EXPO_SKILL_EVAL_KEEP: '1' keeps workspaces for inspection
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, test } from 'vitest';

import { runAgentAsync } from './agent';
import { scaffoldBaseAppAsync } from './scaffold';
import { runCommandAsync } from './subprocess';
import type {
  AgentEvalOptions,
  Condition,
  DefineChecks,
  EvalWorkspace,
  ProjectSetup,
} from './types';
import { createWorkspace } from './workspace';

export { expect } from 'vitest';
export { loadAstSupport, type AstSupport } from './ast';
export { createWorkspace, stripComments } from './workspace';
export type {
  AgentEvalOptions,
  CheckContext,
  CheckFn,
  Condition,
  DefineChecks,
  EvalWorkspace,
  PrepareContext,
  ProjectSetup,
} from './types';

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
        const root = seedWorkspace(scaffold, setup, fixturesDir);
        await setup.prepareAsync?.({
          root,
          condition,
          runAsync: (command, args, runOptions) =>
            runCommandAsync(root, command, args, runOptions?.timeoutSeconds ?? 600),
        });
        // Last word on the dependency: the package under test always
        // resolves to the local checkout, whatever preparation installed.
        linkPackageUnderTest(root, setup.packageName, packageRoot);
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
}

function seedWorkspace(scaffold: string, setup: ProjectSetup, fixturesDir: string): string {
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

  // The scaffold's package.json + the case's extra dependencies.
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
function linkPackageUnderTest(root: string, packageName: string, packageRoot: string) {
  const packageJsonPath = path.join(root, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.dependencies = {
    ...packageJson.dependencies,
    [packageName]: `file:${packageRoot}`,
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

function toPath(location: URL | string): string {
  return location instanceof URL || String(location).startsWith('file:')
    ? fileURLToPath(location)
    : String(location);
}
