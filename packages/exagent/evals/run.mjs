#!/usr/bin/env node
// @ref llp/0002-testing-and-evals.plan.md
//
// Eval runner for the exagent scenario suite. Dependency-free on purpose: node built-ins only,
// so it runs on a bare GitHub runner right after checkout. See ./schema.md for the scenario and
// grader format.
//
// Usage:
//   node evals/run.mjs --dry-run                  Validate every scenario and print the plan
//   node evals/run.mjs --tier 0                   Run the tier 0 scenarios
//   node evals/run.mjs --tier 0 --scenario <id>   Run one scenario
//   node evals/run.mjs --tier 1                   Run the tier 1 scenarios with a local model
//                                                 via Ollama (OLLAMA_HOST, EXAGENT_EVAL_MODEL)
//   node evals/run.mjs --tier 2                   Run the tier 2 scenarios with Claude Code
//                                                 headless (ANTHROPIC_API_KEY required)

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EVALS_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(EVALS_DIR, '..');
const SCENARIOS_DIR = path.join(EVALS_DIR, 'scenarios');
const CLI_BIN = path.join(PACKAGE_ROOT, 'bin', 'exagent.js');
const CLI_BUILD = path.join(PACKAGE_ROOT, 'build', 'cli', 'index.js');

const TIERS = [0, 1, 2];
const DRIVING_AGENTS = {
  deterministic: 0,
  'local-model': 1,
  'frontier-agent': 2,
};
const GRADER_TYPES = ['exit-code', 'path-exists', 'jsonl-event', 'http-probe'];
const DEFAULT_TIMEOUT_MS = 120_000;

// Tier 1: best-effort agent-in-the-loop with a local model (LLP 0002). The model is pinned and
// decoding is greedy (temperature 0, fixed seed) so runs are as reproducible as inference gets.
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
const TIER1_MODEL = process.env.EXAGENT_EVAL_MODEL ?? 'qwen3:4b';
const TIER1_MAX_TURNS = 8;
const TIER1_OUTPUT_LIMIT = 800;
const TIER1_SEED = 42;

// Tier 2: a frontier agent (Claude Code headless) drives the scenario for real. Runs from the
// label-triggered EAS workflow (.eas/workflows/exagent-tier2-evals.yml); needs ANTHROPIC_API_KEY.
const TIER2_AGENT_BIN = process.env.EXAGENT_TIER2_AGENT ?? 'claude';
const TIER2_MAX_TURNS = 12;
const TIER2_TIMEOUT_MS = 600_000;

const USAGE = `Run the exagent eval scenarios.

Usage: node evals/run.mjs [options]

Options:
  --tier <0|1|2>     Run the scenarios of one tier. Omit with --dry-run to plan every tier.
  --scenario <id>    Limit to one scenario. Can be repeated.
  --dry-run          Validate the scenarios and print the plan without executing anything.
  -h, --help         Usage info
`;

function parseArgs(argv) {
  const options = { tier: undefined, scenarios: [], dryRun: false, help: false };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    switch (arg) {
      case '--tier': {
        const value = argv[++index];
        const tier = Number(value);
        if (!TIERS.includes(tier)) {
          throw new UsageError(`--tier expects one of ${TIERS.join(', ')}, received: ${value}`);
        }
        options.tier = tier;
        break;
      }
      case '--scenario': {
        const value = argv[++index];
        if (!value) {
          throw new UsageError('--scenario expects a scenario id');
        }
        options.scenarios.push(value);
        break;
      }
      case '--dry-run':
        options.dryRun = true;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      default:
        throw new UsageError(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

class UsageError extends Error {}

/* -------------------------------------------------------------------------- */
/* Loading and validation                                                     */
/* -------------------------------------------------------------------------- */

function loadScenarios() {
  const files = fs
    .readdirSync(SCENARIOS_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort();

  return files.map((file) => {
    const filePath = path.join(SCENARIOS_DIR, file);
    let scenario;
    try {
      scenario = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return { file, filePath, scenario: undefined, errors: [`invalid JSON: ${error.message}`] };
    }
    return { file, filePath, scenario, errors: validateScenario(scenario, file) };
  });
}

/** Check a scenario against the shape documented in ./schema.md. Returns a list of problems. */
function validateScenario(scenario, file) {
  const errors = [];

  if (typeof scenario !== 'object' || scenario === null || Array.isArray(scenario)) {
    return ['scenario must be a JSON object'];
  }

  for (const field of ['id', 'fixture', 'taskPrompt', 'drivingAgent']) {
    if (typeof scenario[field] !== 'string' || !scenario[field]) {
      errors.push(`"${field}" must be a non-empty string`);
    }
  }

  const expectedId = path.basename(file, '.json');
  if (scenario.id && scenario.id !== expectedId) {
    errors.push(`"id" is "${scenario.id}" but the file name says "${expectedId}"`);
  }

  if (scenario.drivingAgent && !(scenario.drivingAgent in DRIVING_AGENTS)) {
    errors.push(
      `"drivingAgent" must be one of ${Object.keys(DRIVING_AGENTS).join(', ')}, received: ${scenario.drivingAgent}`
    );
  }

  if (!Array.isArray(scenario.tiers) || scenario.tiers.length === 0) {
    errors.push('"tiers" must be a non-empty array');
  } else {
    for (const tier of scenario.tiers) {
      if (!TIERS.includes(tier)) {
        errors.push(
          `"tiers" contains ${JSON.stringify(tier)}, expected one of ${TIERS.join(', ')}`
        );
      }
    }
  }

  if (Array.isArray(scenario.tiers) && scenario.tiers.includes(0)) {
    const command = scenario.command;
    if (typeof command !== 'object' || command === null) {
      errors.push('"command" is required for tier 0 scenarios');
    } else {
      if (!Array.isArray(command.argv) || command.argv.length === 0) {
        errors.push('"command.argv" must be a non-empty array');
      } else if (command.argv.some((part) => typeof part !== 'string')) {
        errors.push('"command.argv" must contain only strings');
      }
      if (command.env !== undefined && (typeof command.env !== 'object' || command.env === null)) {
        errors.push('"command.env" must be an object');
      }
      if (command.timeoutMs !== undefined && !Number.isFinite(command.timeoutMs)) {
        errors.push('"command.timeoutMs" must be a number');
      }
    }
  }

  if (!Array.isArray(scenario.graders) || scenario.graders.length === 0) {
    errors.push('"graders" must be a non-empty array');
  } else {
    scenario.graders.forEach((grader, index) => {
      errors.push(...validateGrader(grader, index));
    });
  }

  return errors;
}

function validateGrader(grader, index) {
  const at = `graders[${index}]`;
  if (typeof grader !== 'object' || grader === null || Array.isArray(grader)) {
    return [`${at} must be an object`];
  }
  if (!GRADER_TYPES.includes(grader.type)) {
    return [`${at}.type must be one of ${GRADER_TYPES.join(', ')}, received: ${grader.type}`];
  }

  const errors = [];
  switch (grader.type) {
    case 'exit-code':
      if (!Number.isInteger(grader.expect)) {
        errors.push(`${at}.expect must be an integer`);
      }
      break;
    case 'path-exists':
      if (typeof grader.path !== 'string' || !grader.path) {
        errors.push(`${at}.path must be a non-empty string`);
      }
      if (grader.kind !== undefined && !['file', 'directory', 'symlink'].includes(grader.kind)) {
        errors.push(`${at}.kind must be one of file, directory, symlink`);
      }
      break;
    case 'jsonl-event':
      if (typeof grader.file !== 'string' || !grader.file) {
        errors.push(`${at}.file must be a non-empty string`);
      }
      if (typeof grader.event !== 'string' || !grader.event) {
        errors.push(`${at}.event must be a non-empty string`);
      }
      if (grader.atLeast !== undefined && !Number.isInteger(grader.atLeast)) {
        errors.push(`${at}.atLeast must be an integer`);
      }
      break;
    case 'http-probe':
      if (typeof grader.url !== 'string' || !grader.url) {
        errors.push(`${at}.url must be a non-empty string`);
      }
      if (grader.expectStatus !== undefined && !Number.isInteger(grader.expectStatus)) {
        errors.push(`${at}.expectStatus must be an integer`);
      }
      break;
  }
  return errors;
}

function describeGrader(grader) {
  switch (grader.type) {
    case 'exit-code':
      return `exit-code == ${grader.expect}`;
    case 'path-exists':
      return `path-exists ${grader.path}${grader.kind ? ` (${grader.kind})` : ''}`;
    case 'jsonl-event':
      return `jsonl-event ${grader.event} in ${grader.file} (>= ${grader.atLeast ?? 1})`;
    case 'http-probe':
      return `http-probe ${grader.url} -> ${grader.expectStatus ?? 200}`;
    default:
      return grader.type;
  }
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Copy a fixture into a fresh temporary directory. Symlinks are dereferenced so that a fixture
 * linking workspace packages into `node_modules` still resolves from the copy; broken links are
 * skipped instead of failing the run.
 */
function copyFixture(fixtureDir, targetDir) {
  const skipped = [];
  copyInto(fixtureDir, targetDir, skipped);
  return skipped;
}

function copyInto(sourceDir, targetDir, skipped) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.name === '.git') {
      continue;
    }

    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);
    let stats;
    try {
      stats = fs.statSync(source);
    } catch {
      skipped.push(source);
      continue;
    }

    if (stats.isDirectory()) {
      copyInto(source, target, skipped);
    } else if (stats.isFile()) {
      fs.copyFileSync(source, target);
      fs.chmodSync(target, stats.mode & 0o777);
    } else {
      skipped.push(source);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Graders                                                                    */
/* -------------------------------------------------------------------------- */

async function applyGrader(grader, context) {
  switch (grader.type) {
    case 'exit-code': {
      const actual = context.result.exitCode;
      return {
        pass: actual === grader.expect,
        detail: `exit code ${actual}, expected ${grader.expect}`,
      };
    }
    case 'path-exists': {
      const target = path.join(context.workspace, grader.path);
      let stats;
      try {
        stats = fs.lstatSync(target);
      } catch {
        return { pass: false, detail: `${grader.path} does not exist` };
      }
      if (!grader.kind) {
        return { pass: true, detail: `${grader.path} exists` };
      }
      if (grader.kind === 'symlink') {
        return { pass: stats.isSymbolicLink(), detail: `${grader.path} is not a symlink` };
      }
      // A symlink to a directory satisfies `directory`, matching how the CLI links skills.
      const resolved = stats.isSymbolicLink() ? tryStat(target) : stats;
      if (!resolved) {
        return { pass: false, detail: `${grader.path} is a link to a missing target` };
      }
      const pass = grader.kind === 'directory' ? resolved.isDirectory() : resolved.isFile();
      return {
        pass,
        detail: pass
          ? `${grader.path} is a ${grader.kind}`
          : `${grader.path} is not a ${grader.kind}`,
      };
    }
    case 'jsonl-event': {
      const target = path.join(context.workspace, grader.file);
      let contents;
      try {
        contents = fs.readFileSync(target, 'utf8');
      } catch {
        return { pass: false, detail: `${grader.file} does not exist` };
      }
      const atLeast = grader.atLeast ?? 1;
      let count = 0;
      for (const line of contents.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        let entry;
        try {
          entry = JSON.parse(trimmed);
        } catch {
          continue;
        }
        // `2g` names the event in `_e`; the other three cover the JSONL shapes of other tools.
        const name = entry?._e ?? entry?.event ?? entry?.name ?? entry?.type;
        if (name === grader.event) {
          count++;
        }
      }
      return {
        pass: count >= atLeast,
        detail: `found ${count} "${grader.event}" event(s) in ${grader.file}, expected >= ${atLeast}`,
      };
    }
    case 'http-probe': {
      const expectStatus = grader.expectStatus ?? 200;
      const status = await probe(grader.url, grader.timeoutMs ?? 10_000);
      return {
        pass: status === expectStatus,
        detail: `${grader.url} responded ${status ?? 'no response'}, expected ${expectStatus}`,
      };
    }
    default:
      return { pass: false, detail: `unknown grader type: ${grader.type}` };
  }
}

function tryStat(target) {
  try {
    return fs.statSync(target);
  } catch {
    return undefined;
  }
}

function probe(url, timeoutMs) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    const request = client.get(url, { timeout: timeoutMs }, (response) => {
      response.resume();
      resolve(response.statusCode);
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve(undefined));
  });
}

/* -------------------------------------------------------------------------- */
/* Tier 0 execution                                                           */
/* -------------------------------------------------------------------------- */

function runCli(argv, { cwd, env, timeoutMs }) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI_BIN, ...argv], {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));

    child.on('close', (code, signal) => {
      resolve({ exitCode: code ?? -1, signal, stdout, stderr });
    });
    child.on('error', (error) => {
      resolve({ exitCode: -1, signal: null, stdout, stderr: `${stderr}${error.message}` });
    });
  });
}

async function runTier0Scenario(scenario) {
  const fixtureDir = path.join(PACKAGE_ROOT, scenario.fixture);
  if (!fs.existsSync(fixtureDir)) {
    return {
      pass: false,
      reason: `fixture not found: ${scenario.fixture}. Create it under packages/exagent/${scenario.fixture} or fix the scenario's "fixture" field.`,
    };
  }

  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), `exagent-eval-${scenario.id}-`));
  const skipped = copyFixture(fixtureDir, workspace);
  for (const entry of skipped) {
    console.log(`    note: skipped unreadable fixture entry ${path.relative(fixtureDir, entry)}`);
  }

  const command = scenario.command;
  const result = await runCli(command.argv, {
    cwd: workspace,
    env: { ...process.env, CI: '1', ...(command.env ?? {}) },
    timeoutMs: command.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  });

  console.log(`    ran: exagent ${command.argv.join(' ')} (exit ${result.exitCode})`);

  const grades = [];
  for (const grader of scenario.graders) {
    const grade = await applyGrader(grader, { workspace, result });
    grades.push({ grader, ...grade });
    console.log(`    ${grade.pass ? 'PASS' : 'FAIL'} ${describeGrader(grader)} — ${grade.detail}`);
  }

  const pass = grades.every((grade) => grade.pass);
  if (pass) {
    fs.rmSync(workspace, { recursive: true, force: true });
  } else {
    console.log(`    workspace kept for triage: ${workspace}`);
    if (result.stdout.trim()) {
      console.log(indent(result.stdout.trim(), '    stdout: '));
    }
    if (result.stderr.trim()) {
      console.log(indent(result.stderr.trim(), '    stderr: '));
    }
  }

  return { pass, reason: pass ? undefined : 'one or more graders failed' };
}

function indent(text, prefix) {
  return text
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

/* -------------------------------------------------------------------------- */
/* Tier 1 execution — local model over Ollama                                 */
/* -------------------------------------------------------------------------- */

// The command list below duplicates the CLI surface, so it drifts whenever a command or flag is
// added. Source of truth: the `commands` registry in src/cli.ts and the `printHelp` block of each
// command's index.ts. Update this prompt and TIER2_COMMAND_SUMMARY together when either changes.
// The `--help` escape hatch keeps a stale list from being a dead end for the model.
const TIER1_SYSTEM_PROMPT = `You are an autonomous agent completing a task in an Expo project using the \`exagent\` CLI.

Available commands:
  exagent context [--json]              Print project state: SDK version, native state, Expo Go support, fingerprint
  exagent start                         Start the dev server
  exagent start --plan                  Print what must run to get the app running, then exit without running it
  exagent start --smart                 Print that plan, then run its steps
  exagent skills sync --agent <agent>   Link agent skills from installed packages
  exagent skills list [--json]          List discovered skills
  exagent skills show <package>         Print a package's skill
  exagent skills clean                  Remove managed skill links
  exagent install <packages..>          Install packages with expo, then sync skills

Valid --agent values: claude-code, cursor, codex, opencode, windsurf, gemini-cli

Respond with EXACTLY ONE JSON object and nothing else:
  {"run": ["skills", "sync", "--agent", "claude-code"]}   to execute an exagent command
  {"done": true, "summary": "<what you accomplished>"}    when the task is complete

Rules: one command per turn; wait for the result before deciding the next step; prefer the fewest commands that complete the task. Do not invent flags: if you need a flag that is not listed above, run the command with --help first and read the real flags from the output.`;

// Plain http.request instead of fetch: Node's fetch (undici) enforces a 5-minute headers
// timeout, which a slow CPU-only CI runner can exceed on a long-context inference call
// (observed: HeadersTimeoutError on the 2nd turn of start-plan, expo/expo#49229 tier 1).
const TIER1_REQUEST_TIMEOUT_MS = 900_000;

function chatOllama(messages) {
  const body = JSON.stringify({
    model: TIER1_MODEL,
    messages,
    stream: false,
    format: 'json',
    options: { temperature: 0, seed: TIER1_SEED },
  });
  const url = new URL('/api/chat', OLLAMA_HOST);
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.request(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: TIER1_REQUEST_TIMEOUT_MS,
      },
      (response) => {
        let data = '';
        response.on('data', (chunk) => (data += chunk));
        response.on('end', () => {
          if ((response.statusCode ?? 0) >= 400) {
            reject(new Error(`Ollama /api/chat responded ${response.statusCode}: ${data}`));
            return;
          }
          try {
            resolve(JSON.parse(data)?.message?.content ?? '');
          } catch (error) {
            reject(new Error(`Ollama /api/chat returned invalid JSON: ${error.message}`));
          }
        });
      }
    );
    request.on('timeout', () => {
      request.destroy(
        new Error(`Ollama /api/chat timed out after ${TIER1_REQUEST_TIMEOUT_MS / 1000}s`)
      );
    });
    request.on('error', reject);
    request.end(body);
  });
}

async function checkOllamaAsync() {
  let tags;
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`);
    tags = await response.json();
  } catch {
    return (
      `Ollama is not reachable at ${OLLAMA_HOST}, so the tier 1 model driver cannot run. ` +
      `Start it with \`ollama serve\`, or point OLLAMA_HOST at a running instance.`
    );
  }
  const models = (tags?.models ?? []).map((model) => model.name);
  const found = models.some((name) => name === TIER1_MODEL || name === `${TIER1_MODEL}:latest`);
  if (!found) {
    return (
      `The pinned tier 1 model "${TIER1_MODEL}" is not available in Ollama (installed: ${models.join(', ') || 'none'}). ` +
      `Pull it first with \`ollama pull ${TIER1_MODEL}\`, or override EXAGENT_EVAL_MODEL.`
    );
  }
  return undefined;
}

/** Parse the model's reply into {run} | {done} | undefined. Tolerates fenced or wrapped JSON. */
function parseTier1Action(content) {
  const candidates = [content];
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    candidates.push(fenced[1]);
  }
  const braced = content.match(/\{[\s\S]*\}/);
  if (braced) {
    candidates.push(braced[0]);
  }
  for (const candidate of candidates) {
    let action;
    try {
      action = JSON.parse(candidate.trim());
    } catch {
      continue;
    }
    if (action && typeof action === 'object') {
      if (Array.isArray(action.run) && action.run.every((part) => typeof part === 'string')) {
        return { run: action.run };
      }
      if (action.done === true) {
        return { done: true, summary: typeof action.summary === 'string' ? action.summary : '' };
      }
    }
  }
  return undefined;
}

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit)}\n[truncated]` : text;
}

async function runTier1Scenario(scenario) {
  const fixtureDir = path.join(PACKAGE_ROOT, scenario.fixture);
  if (!fs.existsSync(fixtureDir)) {
    return { pass: false, reason: `fixture not found: ${scenario.fixture}` };
  }

  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), `exagent-eval1-${scenario.id}-`));
  copyFixture(fixtureDir, workspace);

  const messages = [
    { role: 'system', content: TIER1_SYSTEM_PROMPT },
    { role: 'user', content: `Task: ${scenario.taskPrompt}\nWorking directory: the project root.` },
  ];

  const startedAt = Date.now();
  let lastResult;
  let commandsRun = 0;
  let done = false;

  for (let turn = 1; turn <= TIER1_MAX_TURNS; turn++) {
    let content;
    const turnStartedAt = Date.now();
    try {
      content = await chatOllama(messages);
      console.log(
        `    turn ${turn}: inference ${((Date.now() - turnStartedAt) / 1000).toFixed(1)}s`
      );
    } catch (error) {
      // An inference failure fails this scenario, not the whole runner.
      console.log(`    turn ${turn}: inference failed — ${error.message}`);
      console.log(`    workspace kept for triage: ${workspace}`);
      return { pass: false, reason: `inference failed on turn ${turn}: ${error.message}` };
    }
    messages.push({ role: 'assistant', content });

    const action = parseTier1Action(content);
    if (!action) {
      messages.push({
        role: 'user',
        content:
          'Your reply was not a single valid JSON action. Respond with {"run": [...]} or {"done": true, "summary": "..."} only.',
      });
      console.log(`    turn ${turn}: unparseable reply`);
      continue;
    }

    if (action.done) {
      done = true;
      console.log(`    turn ${turn}: done — ${action.summary || '(no summary)'}`);
      break;
    }

    commandsRun++;
    const result = await runCli(action.run, {
      cwd: workspace,
      // Scenario env (e.g. LOG_EVENTS) applies in every tier — the graders read the same
      // files regardless of which driver ran the command.
      env: { ...process.env, CI: '1', ...(scenario.command?.env ?? {}) },
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });
    lastResult = result;
    console.log(`    turn ${turn}: exagent ${action.run.join(' ')} (exit ${result.exitCode})`);
    messages.push({
      role: 'user',
      content: JSON.stringify({
        exitCode: result.exitCode,
        stdout: truncate(result.stdout, TIER1_OUTPUT_LIMIT),
        stderr: truncate(result.stderr, TIER1_OUTPUT_LIMIT),
      }),
    });
  }

  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `    model: ${TIER1_MODEL}, ${commandsRun} command(s), done=${done}, ${elapsedSeconds}s`
  );

  const grades = [];
  for (const grader of scenario.graders) {
    const grade = await applyGrader(grader, {
      workspace,
      result: lastResult ?? { exitCode: -1, stdout: '', stderr: '' },
    });
    grades.push({ grader, ...grade });
    console.log(`    ${grade.pass ? 'PASS' : 'FAIL'} ${describeGrader(grader)} — ${grade.detail}`);
  }

  const pass = grades.every((grade) => grade.pass);
  if (pass) {
    fs.rmSync(workspace, { recursive: true, force: true });
  } else {
    console.log(`    workspace kept for triage: ${workspace}`);
    console.log(indent(JSON.stringify(messages, null, 2), '    transcript: '));
  }

  return { pass, reason: pass ? undefined : 'one or more graders failed' };
}

/* -------------------------------------------------------------------------- */
/* Tier 2 execution — frontier agent (Claude Code headless)                   */
/* -------------------------------------------------------------------------- */

/** Kept next to TIER1_SYSTEM_PROMPT's list on purpose — see the drift note above it. */
const TIER2_COMMAND_SUMMARY =
  'Available commands: context [--json], start [--plan|--smart], skills [sync|list|show|clean] ' +
  '(sync takes --agent claude-code|cursor|codex|opencode|windsurf|gemini-cli), install <pkg..>.';

function checkTier2() {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return (
      'Tier 2 needs Claude Code credentials: set ANTHROPIC_API_KEY (or CLAUDE_CODE_OAUTH_TOKEN). ' +
      'In CI this comes from the EAS environment; locally, export it before running.'
    );
  }
  return undefined;
}

async function runTier2Scenario(scenario) {
  const fixtureDir = path.join(PACKAGE_ROOT, scenario.fixture);
  if (!fs.existsSync(fixtureDir)) {
    return { pass: false, reason: `fixture not found: ${scenario.fixture}` };
  }

  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), `exagent-eval2-${scenario.id}-`));
  copyFixture(fixtureDir, workspace);

  const prompt =
    `You are working inside an Expo project (the current directory is the project root). ` +
    `Complete this task: ${scenario.taskPrompt}\n\n` +
    `Use the exagent CLI by running it with node, for example:\n` +
    `  node ${CLI_BIN} skills --help\n` +
    `${TIER2_COMMAND_SUMMARY} ` +
    `Any command accepts --help; read the real flags from it rather than guessing. ` +
    `When the task is complete, stop and summarize what you did in one sentence.`;

  const startedAt = Date.now();
  const result = await new Promise((resolve) => {
    const child = spawn(
      TIER2_AGENT_BIN,
      ['-p', prompt, '--allowedTools', 'Bash', '--max-turns', String(TIER2_MAX_TURNS)],
      {
        cwd: workspace,
        env: { ...process.env, CI: '1', ...(scenario.command?.env ?? {}) },
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: TIER2_TIMEOUT_MS,
      }
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (code, signal) => resolve({ exitCode: code ?? -1, signal, stdout, stderr }));
    child.on('error', (error) =>
      resolve({ exitCode: -1, signal: null, stdout, stderr: `${stderr}${error.message}` })
    );
  });

  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `    agent: ${TIER2_AGENT_BIN} headless, exit ${result.exitCode}, ${elapsedSeconds}s`
  );
  if (result.stdout.trim()) {
    console.log(indent(truncate(result.stdout.trim(), TIER1_OUTPUT_LIMIT), '    agent said: '));
  }

  const grades = [];
  for (const grader of scenario.graders) {
    const grade = await applyGrader(grader, { workspace, result });
    grades.push({ grader, ...grade });
    console.log(`    ${grade.pass ? 'PASS' : 'FAIL'} ${describeGrader(grader)} — ${grade.detail}`);
  }

  const pass = grades.every((grade) => grade.pass);
  if (pass) {
    fs.rmSync(workspace, { recursive: true, force: true });
  } else {
    console.log(`    workspace kept for triage: ${workspace}`);
    if (result.stderr.trim()) {
      console.log(indent(result.stderr.trim(), '    stderr: '));
    }
  }

  return { pass, reason: pass ? undefined : 'one or more graders failed' };
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`${error.message}\n\n${USAGE}`);
      return 1;
    }
    throw error;
  }

  if (options.help) {
    console.log(USAGE);
    return 0;
  }

  if (options.tier === undefined && !options.dryRun) {
    console.error(`--tier is required unless --dry-run is passed.\n\n${USAGE}`);
    return 1;
  }

  const loaded = loadScenarios();
  if (!loaded.length) {
    console.error(`No scenarios found in ${path.relative(PACKAGE_ROOT, SCENARIOS_DIR)}`);
    return 1;
  }

  // Validate every scenario, whatever tier is requested — a malformed file is always a failure.
  let invalid = 0;
  for (const entry of loaded) {
    if (entry.errors.length) {
      invalid++;
      console.error(`invalid scenario ${entry.file}:`);
      for (const error of entry.errors) {
        console.error(`  - ${error}`);
      }
    }
  }
  if (invalid) {
    console.error(`\n${invalid} scenario file(s) do not match evals/schema.md.`);
    return 1;
  }

  let scenarios = loaded.map((entry) => entry.scenario);
  if (options.scenarios.length) {
    const known = new Set(scenarios.map((scenario) => scenario.id));
    const unknown = options.scenarios.filter((id) => !known.has(id));
    if (unknown.length) {
      console.error(
        `Unknown scenario id(s): ${unknown.join(', ')}. Known: ${[...known].join(', ')}`
      );
      return 1;
    }
    scenarios = scenarios.filter((scenario) => options.scenarios.includes(scenario.id));
  }

  const tiers = options.tier === undefined ? TIERS : [options.tier];
  const plan = tiers.map((tier) => ({
    tier,
    scenarios: scenarios.filter((scenario) => scenario.tiers.includes(tier)),
  }));

  if (options.dryRun) {
    console.log(`exagent evals — plan (${scenarios.length} scenario file(s) validated)\n`);
    for (const { tier, scenarios: tierScenarios } of plan) {
      console.log(`tier ${tier}: ${tierScenarios.length} scenario(s)`);
      for (const scenario of tierScenarios) {
        console.log(`  ${scenario.id}`);
        console.log(`    fixture:      ${scenario.fixture}`);
        console.log(`    task:         ${scenario.taskPrompt}`);
        console.log(`    drivingAgent: ${scenario.drivingAgent}`);
        if (tier === 0 && scenario.command) {
          console.log(`    command:      exagent ${scenario.command.argv.join(' ')}`);
        }
        for (const grader of scenario.graders) {
          console.log(`    grader:       ${describeGrader(grader)}`);
        }
      }
      if (tier === 1 && tierScenarios.length) {
        console.log(`  (tier 1 runs with model ${TIER1_MODEL} via Ollama at ${OLLAMA_HOST})`);
      }
      if (tier === 2 && tierScenarios.length) {
        console.log(`  (tier 2 runs with ${TIER2_AGENT_BIN} headless; needs ANTHROPIC_API_KEY)`);
      }
      console.log('');
    }
    return 0;
  }

  const tier = options.tier;
  const selected = plan[0].scenarios;

  if (tier === 2) {
    const problem = checkTier2();
    if (problem) {
      console.error(problem);
      return 1;
    }
  }

  if (!selected.length) {
    console.error(`No scenarios are declared for tier ${tier}.`);
    return 1;
  }

  if (!fs.existsSync(CLI_BUILD)) {
    console.error(
      `The exagent CLI is not built, so the scenarios cannot run. ${path.relative(PACKAGE_ROOT, CLI_BUILD)} is missing. ` +
        `Build it first with \`pnpm --filter exagent build\`.`
    );
    return 1;
  }

  if (tier === 1) {
    const problem = await checkOllamaAsync();
    if (problem) {
      console.error(problem);
      return 1;
    }
  }

  console.log(
    `exagent evals — tier ${tier}, ${selected.length} scenario(s)` +
      (tier === 1 ? ` — model ${TIER1_MODEL} via ${OLLAMA_HOST}` : '') +
      '\n'
  );

  const failures = [];
  for (const scenario of selected) {
    console.log(`  ${scenario.id} — ${scenario.taskPrompt}`);
    const outcome =
      tier === 2
        ? await runTier2Scenario(scenario)
        : tier === 1
          ? await runTier1Scenario(scenario)
          : await runTier0Scenario(scenario);
    if (!outcome.pass) {
      failures.push({ scenario, reason: outcome.reason });
      console.log(`  FAIL ${scenario.id}: ${outcome.reason}\n`);
    } else {
      console.log(`  PASS ${scenario.id}\n`);
    }
  }

  if (failures.length) {
    console.error(`${failures.length} of ${selected.length} scenario(s) failed:`);
    for (const failure of failures) {
      console.error(`  - ${failure.scenario.id}: ${failure.reason}`);
    }
    return 1;
  }

  console.log(`All ${selected.length} tier ${tier} scenario(s) passed.`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
