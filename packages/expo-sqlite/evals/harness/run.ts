/**
 * Minimal runner for expo-sqlite's colocated evals.
 *
 *   npx tsx evals/harness/run.ts [--case <id>]... [--condition with-skill|without-skill|both]
 *                                [--model <model>] [--install] [--keep] [--timeout <seconds>]
 *                                [--score-only <workspace>]
 *
 * Each eval is a directory under evals/ holding PROMPT.md (frontmatter + the
 * task the agent sees) and EVAL.ts (a default-exported scorer). Optional
 * local/ files seed the workspace on top of the shared fixture.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { runAgentAsync } from './agent';
import { createEvalContext } from './context';
import type { CheckResult, Condition, ScoreResult, Scorer } from './types';

const EVALS_ROOT = path.resolve(__dirname, '..');
const PACKAGE_ROOT = path.resolve(EVALS_ROOT, '..');
const FIXTURE_ROOT = path.join(__dirname, 'fixture');
const SKILL_ROOT = path.join(PACKAGE_ROOT, 'skills', 'expo-sqlite');
/** Mirrors the link name `npx expo skills` creates for this package's skill. */
const SKILL_LINK_NAME = 'npm-expo-sqlite-expo-sqlite';

interface EvalCase {
  id: string;
  dir: string;
  title: string;
  prompt: string;
}

interface CaseRunResult {
  caseId: string;
  condition: Condition;
  workspace: string;
  skillWasRead?: boolean;
  agentExitCode?: number | null;
  agentTimedOut?: boolean;
  result: ScoreResult;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cases = discoverCases().filter(
    (c) => args.cases.length === 0 || args.cases.includes(c.id)
  );
  if (cases.length === 0) {
    throw new Error(`No matching evals under ${EVALS_ROOT}. Known: ${discoverCases().map((c) => c.id).join(', ')}`);
  }

  const conditions: Condition[] =
    args.condition === 'both' ? ['without-skill', 'with-skill'] : [args.condition];

  const results: CaseRunResult[] = [];
  for (const evalCase of cases) {
    for (const condition of conditions) {
      results.push(await runCaseAsync(evalCase, condition, args));
    }
  }

  printSummary(results);
  const outPath = path.join(os.tmpdir(), 'expo-sqlite-evals', 'summary.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nFull results: ${outPath}`);

  if (!args.keep) {
    for (const r of results) {
      fs.rmSync(r.workspace, { recursive: true, force: true });
    }
    console.log('Workspaces removed (pass --keep to inspect them).');
  }
}

async function runCaseAsync(
  evalCase: EvalCase,
  condition: Condition,
  args: CliArgs
): Promise<CaseRunResult> {
  console.log(`\n▶ ${evalCase.id} [${condition}]`);
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), `expo-sqlite-eval-${evalCase.id}-${condition}-`)
  );

  // Fixture, then the case's local/ overlay, then dependency rewiring.
  fs.cpSync(FIXTURE_ROOT, workspace, { recursive: true });
  const localDir = path.join(evalCase.dir, 'local');
  if (fs.existsSync(localDir)) {
    fs.cpSync(localDir, workspace, { recursive: true });
  }
  pointDependencyAtLocalPackage(workspace);

  if (condition === 'with-skill') {
    // Copy of the layout `npx expo skills` links for claude-code.
    fs.cpSync(SKILL_ROOT, path.join(workspace, '.claude', 'skills', SKILL_LINK_NAME), {
      recursive: true,
    });
  }
  if (args.install) {
    execFileSync('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: workspace,
      stdio: 'inherit',
    });
  }

  const agent = await runAgentAsync({
    workspace,
    prompt: evalCase.prompt,
    model: args.model,
    timeoutSeconds: args.timeoutSeconds,
  });

  const scorer = (await import(path.join(evalCase.dir, 'EVAL.ts'))).default as Scorer;
  const result = await scorer(createEvalContext(workspace, condition));
  fs.writeFileSync(
    path.join(workspace, '.eval', 'results.json'),
    JSON.stringify({ evalCase: evalCase.id, condition, agent, result }, null, 2)
  );

  return {
    caseId: evalCase.id,
    condition,
    workspace,
    skillWasRead: condition === 'with-skill' ? agent.skillWasRead : undefined,
    agentExitCode: agent.exitCode,
    agentTimedOut: agent.timedOut,
    result,
  };
}

function pointDependencyAtLocalPackage(workspace: string) {
  const packageJsonPath = path.join(workspace, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.dependencies?.['expo-sqlite']) {
    packageJson.dependencies['expo-sqlite'] = `file:${PACKAGE_ROOT}`;
  }
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

function discoverCases(): EvalCase[] {
  return fs
    .readdirSync(EVALS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(EVALS_ROOT, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, 'PROMPT.md')))
    .map((dir) => {
      const { frontmatter, body } = parseFrontmatter(
        fs.readFileSync(path.join(dir, 'PROMPT.md'), 'utf8')
      );
      return {
        id: path.basename(dir),
        dir,
        title: frontmatter.title ?? path.basename(dir),
        prompt: body.trim(),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Flat `key: value` frontmatter only — same constraint as `npx expo skills`. */
function parseFrontmatter(contents: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const lines = contents.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return { frontmatter: {}, body: contents };
  }
  const frontmatter: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return { frontmatter, body: lines.slice(i + 1).join('\n') };
    }
    const match = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(lines[i]);
    if (match) {
      frontmatter[match[1]] = match[2].trim();
    }
  }
  return { frontmatter: {}, body: contents };
}

function printSummary(results: CaseRunResult[]) {
  console.log('\n== Summary ==');
  for (const r of results) {
    const scored = r.result.checks.filter(
      (c: CheckResult) => c.status === 'passed' || c.status === 'failed'
    );
    const passed = scored.filter((c) => c.status === 'passed').length;
    const trigger =
      r.skillWasRead === undefined ? '' : r.skillWasRead ? ' skill:read' : ' skill:NOT-read';
    console.log(
      `${r.result.passed ? 'PASS' : 'FAIL'}  ${r.caseId} [${r.condition}] ${passed}/${scored.length} checks${trigger}`
    );
    for (const c of r.result.checks) {
      const marker =
        c.status === 'passed' ? '✓' : c.status === 'failed' ? '✗' : `(${c.status})`;
      console.log(`      ${marker} ${c.name}${c.notes ? ` — ${c.notes}` : ''}`);
    }
  }
}

interface CliArgs {
  cases: string[];
  condition: Condition | 'both';
  model?: string;
  install: boolean;
  keep: boolean;
  timeoutSeconds: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    cases: [],
    condition: 'both',
    install: false,
    keep: false,
    timeoutSeconds: 900,
  };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--case':
        args.cases.push(argv[++i]);
        break;
      case '--condition':
        args.condition = argv[++i] as CliArgs['condition'];
        break;
      case '--model':
        args.model = argv[++i];
        break;
      case '--install':
        args.install = true;
        break;
      case '--keep':
        args.keep = true;
        break;
      case '--timeout':
        args.timeoutSeconds = Number(argv[++i]);
        break;
      default:
        throw new Error(`Unknown argument: ${argv[i]}`);
    }
  }
  return args;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
