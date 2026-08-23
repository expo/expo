/* eslint-env jest */
// @ref llp/0010-agent-conventions.rfc.md §Exit codes — a forwarded code is handed back verbatim.
//
// `exagent doctor:check` is a wrapper around `expo-doctor`, which has no `--json` and exits 1 when
// any check fails. These tests drive the published CLI against a stub `expo-doctor` installed into
// the fixture's `node_modules/.bin` — the first place the resolver looks — so the mirrored exit
// code and the best-effort parse are asserted without running 21 real checks over the network.
//
// The stub's output is a trimmed copy of a real expo-doctor 1.20.1 run; the full recording lives in
// `src/doctor/__tests__/fixtures/` with its provenance.
import fs from 'node:fs';
import path from 'node:path';

import { executeExagentAsync, installStubBinAsync, setupFixtureAsync } from '../utils';

/** The shape `doctor:check --json` prints, per `src/doctor/types.ts`. */
type DoctorPayload = {
  projectRoot: string;
  passed: number;
  failed: number;
  checks: { name: string; status: string; issues: string[]; advice: string[] }[];
  parse: 'full' | 'best-effort' | 'failed';
  raw: string;
  exitCode: number | null;
  followups: { id: string; command: string; why: string }[];
};

const STUB_LOG_NAME = 'stub-expo-doctor-invocations.jsonl';

/**
 * Stub `expo-doctor` bin. It records its invocation and prints the lines the real tool prints,
 * with the closing summary on stderr and a non-zero exit, exactly as `Log.exit` leaves it.
 *
 * Environment variables the tests steer it with:
 * - STUB_DOCTOR_MODE: `failing` (default), `passing`, or `garbage` for output nothing can parse
 */
const STUB_DOCTOR = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const cwd = process.cwd();
fs.appendFileSync(
  path.join(cwd, ${JSON.stringify(STUB_LOG_NAME)}),
  JSON.stringify({ args, cwd }) + '\\n'
);

const mode = process.env.STUB_DOCTOR_MODE || 'failing';

if (mode === 'not-found') {
  // What \`npx expo-doctor\` leaves behind on a machine that can neither find nor fetch it.
  process.stderr.write('sh: expo-doctor: command not found\\n');
  process.exit(127);
}

if (mode === 'garbage') {
  process.stderr.write('TypeError: Cannot read properties of undefined (reading \\'exp\\')\\n');
  process.exit(1);
}

process.stdout.write('expo-doctor: v1.20.1\\n');
process.stdout.write('Running 3 checks on your project...\\n');

if (mode === 'passing') {
  process.stdout.write('✔ Check for common project setup issues\\n');
  process.stdout.write('✔ Check for lock file\\n');
  process.stdout.write('✔ Check that packages match versions required by installed Expo SDK\\n');
  process.stdout.write('\\n');
  process.stdout.write('3/3 checks passed. No issues detected!\\n');
  process.exit(0);
}

process.stdout.write('✔ Check for common project setup issues\\n');
process.stdout.write('✖ Check for lock file\\n');
process.stdout.write('✖ Check that packages match versions required by installed Expo SDK\\n');
process.stdout.write('\\n');
process.stdout.write('1/3 checks passed. 2 checks failed. Possible issues detected:\\n');
process.stdout.write('\\n');
process.stdout.write('✖ Check for lock file\\n');
process.stdout.write('No lock file was found in this project.\\n');
process.stdout.write('Advice:\\n');
process.stdout.write('Run your package manager to generate one, and commit it.\\n');
process.stdout.write('\\n');
process.stdout.write('✖ Check that packages match versions required by installed Expo SDK\\n');
process.stdout.write('expo-camera  expected 17.0.1  found 17.0.0\\n');
process.stdout.write('1 package out of date.\\n');
process.stdout.write('Advice:\\n');
process.stdout.write("Use 'npx expo install --check' to review and upgrade your dependencies.\\n");
process.stdout.write('\\n');
process.stderr.write('2 checks failed, indicating possible issues with the project.\\n');
process.exit(1);
`;

/**
 * Copy a fixture and install the stub `expo-doctor` into `node_modules/.bin`, which is where
 * `resolveExpoDoctorCli` looks first — the project's own copy wins over the registry.
 */
async function setupAsync(fixtureName: string): Promise<string> {
  const projectRoot = await fs.promises.realpath(await setupFixtureAsync(fixtureName));
  const binDir = path.join(projectRoot, 'node_modules', '.bin');
  const stubScript = path.join(binDir, 'expo-doctor-stub.js');
  await fs.promises.mkdir(binDir, { recursive: true });
  await fs.promises.writeFile(stubScript, STUB_DOCTOR);
  await installStubBinAsync(binDir, 'expo-doctor', stubScript);
  return projectRoot;
}

/** Every invocation the stub recorded. */
function readInvocations(projectRoot: string): { args: string[]; cwd: string }[] {
  const logPath = path.join(projectRoot, STUB_LOG_NAME);
  return fs.existsSync(logPath)
    ? fs
        .readFileSync(logPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];
}

/** Every JSONL event of one run. `2g` names the event in the `_e` field. */
function readEvents(eventsFile: string): any[] {
  return fs
    .readFileSync(eventsFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe('exagent doctor:check', () => {
  it('mirrors the exit code of a run with failing checks', async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['doctor:check', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    const payload: DoctorPayload = JSON.parse(result.stdout);
    expect(payload).toMatchObject({ passed: 1, failed: 2, parse: 'full', exitCode: 1 });
    // `--verbose` is what makes the passing checks nameable at all.
    expect(readInvocations(projectRoot).map((invocation) => invocation.args)).toEqual([
      ['--verbose'],
    ]);
  });

  it('reads the checks back out of the prose, issues and advice apart', async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['doctor:check', '--json'], {
      reject: false,
    });
    const payload: DoctorPayload = JSON.parse(result.stdout);

    expect(payload.checks).toHaveLength(3);
    expect(payload.checks[0]).toEqual({
      name: 'Check for common project setup issues',
      status: 'passed',
      issues: [],
      advice: [],
    });
    expect(payload.checks[1]).toEqual({
      name: 'Check for lock file',
      status: 'failed',
      issues: ['No lock file was found in this project.'],
      advice: ['Run your package manager to generate one, and commit it.'],
    });
  });

  // A best-effort parse that drops information is worse than one that keeps it, so the full text
  // is always there for an agent to read past whatever the parser missed.
  it('carries the full expo-doctor output under raw', async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['doctor:check', '--json'], {
      reject: false,
    });
    const payload: DoctorPayload = JSON.parse(result.stdout);

    expect(payload.raw).toContain('1/3 checks passed. 2 checks failed.');
    expect(payload.raw).toContain('expo-camera  expected 17.0.1  found 17.0.0');
    // The closing line goes to stderr, and it is part of the answer too.
    expect(payload.raw).toContain('2 checks failed, indicating possible issues with the project.');
  });

  it('exits 0 when every check passed', async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['doctor:check', '--json'], {
      env: { STUB_DOCTOR_MODE: 'passing' },
    });

    expect(result.exitCode).toBe(0);
    const payload: DoctorPayload = JSON.parse(result.stdout);
    expect(payload).toMatchObject({ passed: 3, failed: 0, parse: 'full' });
    expect(payload.followups).toEqual([]);
  });

  it('prints a terse report with the failures and their advice', async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['doctor:check'], { reject: false });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Checks       1/3 passed');
    expect(result.stdout).toContain('Failed       2');
    expect(result.stdout).toContain('Parse        full');
    expect(result.stdout).toContain('✖ Check for lock file');
    expect(result.stdout).toContain('→ Run your package manager to generate one, and commit it.');
    // A passing check has nothing to say.
    expect(result.stdout).not.toContain('✖ Check for common project setup issues');
  });

  // `doctor:fix` does not exist yet, so the next action is the one the failing check itself named.
  it('suggests what the failing checks advised', async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['doctor:check'], { reject: false });

    expect(result.stdout).toContain('npx expo install --check');
    expect(result.stdout).not.toContain('doctor:fix');
  });

  it('emits one cli:doctor_check event with the counts and the parse quality', async () => {
    const projectRoot = await setupAsync('go-app');
    const eventsFile = path.join(projectRoot, 'events.jsonl');

    await executeExagentAsync(projectRoot, ['doctor:check', '--json'], {
      env: { LOG_EVENTS: eventsFile },
      reject: false,
    });

    const event = readEvents(eventsFile).find((entry) => entry._e === 'cli:doctor_check');
    expect(event).toMatchObject({ passed: 1, failed: 2, parse: 'full', exitCode: 1 });
  });

  // A parse that found nothing must not report zeroes that look like a clean project.
  it('admits a failed parse, keeps raw, and still mirrors the exit code', async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['doctor:check', '--json'], {
      env: { STUB_DOCTOR_MODE: 'garbage' },
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    const payload: DoctorPayload = JSON.parse(result.stdout);
    expect(payload).toMatchObject({ passed: 0, failed: 0, checks: [], parse: 'failed' });
    expect(payload.raw).toContain('TypeError: Cannot read properties of undefined');
  });

  // 127 is the shell's "command not found", so expo-doctor never ran. Mirroring it would hand the
  // caller a code that looks like a verdict on the project, and it is a verdict on the machine.
  it('reports a machine where expo-doctor could not run at all, and exits 1', async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['doctor:check'], {
      env: { STUB_DOCTOR_MODE: 'not-found' },
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.all).toContain('Could not run expo-doctor');
    expect(result.all).toContain('command not found');
    expect(result.all).toContain('Try: npm install --save-dev expo-doctor');
  });

  it('runs doctor:check for the bare group name', async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['doctor'], {
      env: { STUB_DOCTOR_MODE: 'passing' },
    });

    expect(result.exitCode).toBe(0);
    expect(readInvocations(projectRoot)).toHaveLength(1);
  });

  it('prints its own help without running expo-doctor', async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['doctor:check', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('npx exagent doctor:check');
    expect(result.stdout).toContain('--json');
    expect(readInvocations(projectRoot)).toEqual([]);
  });
});
