/* eslint-env jest */
// @ref llp/0010-agent-conventions.rfc.md §Exit codes — the outcome band.
//
// `@expo/agent-cli typecheck` is the gate F34 was written for: a friction run finished a feature with
// `dev:wait` at 0, `runtime:errors --fail-on-error` at 0 and `doctor` at 21/21, then found seven
// type errors — one of them `Spacing.md` on a constant with no `md`, which is `undefined` at
// runtime, so the screen rendered with no padding and nothing threw anywhere.
//
// These tests drive the published CLI against a stub `tsc` installed into the fixture's
// `node_modules/.bin` — the only place the resolver looks — so the exit code, the parse and the
// three output channels are asserted across the real process boundary. The stub's output is a
// trimmed copy of a real run; the full recordings live in `src/typecheck/__tests__/fixtures/`
// with their provenance.
import fs from 'node:fs';
import path from 'node:path';

import { executeAgentCliAsync, installStubBinAsync, setupFixtureAsync } from '../utils';

const STUB_LOG_NAME = 'stub-tsc-invocations.jsonl';

/**
 * Stub `tsc` bin. It records its invocation and prints what the compiler prints.
 *
 * Environment variables the tests steer it with:
 * - STUB_TSC_MODE: `errors` (default), `clean`, `pretty`, or `unreadable`
 */
const STUB_TSC = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const cwd = process.cwd();
fs.appendFileSync(
  path.join(cwd, ${JSON.stringify(STUB_LOG_NAME)}),
  JSON.stringify({ args, cwd }) + '\\n'
);

const mode = process.env.STUB_TSC_MODE || 'errors';

if (mode === 'clean') {
  process.exit(0);
}

if (mode === 'unreadable') {
  // A compiler that failed and printed nothing a parse can read.
  process.stderr.write('Killed: 9\\n');
  process.exit(1);
}

if (mode === 'pretty') {
  // The pretty form, colors included, which a project can turn on in its own tsconfig.json.
  process.stdout.write(
    '\\u001b[96msrc/app/notes.tsx\\u001b[0m:\\u001b[93m66\\u001b[0m:\\u001b[93m22\\u001b[0m - ' +
      "\\u001b[91merror\\u001b[0m\\u001b[90m TS2339: \\u001b[0mProperty 'md' does not exist on type '{ readonly two: 8; }'.\\n"
  );
  process.stdout.write('\\n');
  process.stdout.write('\\u001b[7m66\\u001b[0m     padding: Spacing.md,\\n');
  process.stdout.write('\\u001b[7m  \\u001b[0m \\u001b[91m                     ~~\\u001b[0m\\n');
  process.stdout.write('\\n\\nFound 1 error in src/app/notes.tsx\\n');
  process.exit(2);
}

process.stdout.write(
  "src/app/notes.tsx(12,7): error TS2322: Type '(value: number) => void' is not assignable to type '(value: string) => void'.\\n"
);
process.stdout.write("  Types of parameters 'value' and 'value' are incompatible.\\n");
process.stdout.write("src/app/notes.tsx(66,22): error TS2339: Property 'md' does not exist on type '{ readonly two: 8; }'.\\n");
process.exit(2);
`;

/** Copy a fixture, then make it look like a TypeScript project with the stub compiler in it. */
async function setupTypeScriptProjectAsync(): Promise<string> {
  const projectRoot = await setupFixtureAsync('go-app');
  const stubScript = path.join(projectRoot, 'stub-tsc.js');
  await fs.promises.writeFile(stubScript, STUB_TSC);
  await installStubBinAsync(path.join(projectRoot, 'node_modules', '.bin'), 'tsc', stubScript);
  await fs.promises.writeFile(path.join(projectRoot, 'tsconfig.json'), '{}');
  return projectRoot;
}

/** Every recorded invocation of the stub compiler. */
function invocations(projectRoot: string): { args: string[]; cwd: string }[] {
  const logPath = path.join(projectRoot, STUB_LOG_NAME);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe('@expo/agent-cli typecheck', () => {
  it(`should exit 20 with the parsed diagnostics when the project does not type-check`, async () => {
    const projectRoot = await setupTypeScriptProjectAsync();

    const result = await executeAgentCliAsync(projectRoot, ['typecheck', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(20);
    const payload = JSON.parse(result.stdout);
    expect(payload.checked).toBe(true);
    expect(payload.errorCount).toBe(2);
    expect(payload.errors[1]).toEqual({
      file: 'src/app/notes.tsx',
      line: 66,
      column: 22,
      code: 'TS2339',
      message: `Property 'md' does not exist on type '{ readonly two: 8; }'.`,
    });
    // The nested explanation travels with the diagnostic it explains.
    expect(payload.errors[0].message).toContain(
      `Types of parameters 'value' and 'value' are incompatible.`
    );
    expect(payload.followups.map((followup: any) => followup.id)).toEqual(['typecheck-rerun']);

    // The compiler is asked for the terse form, and run in the project. `cwd` is compared by its
    // last segment, because macOS reports the temporary directory through its `/private` symlink.
    const calls = invocations(projectRoot);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.args).toEqual(['--noEmit', '--pretty', 'false']);
    expect(calls[0]!.cwd).toContain(path.basename(path.dirname(projectRoot)));
  });

  // @ref llp/0021-honest-reports.rfc.md §A generated file is not a mistake in the code
  // Friction run 7, F64: the first gate an agent runs after `@expo/agent-cli new` was red, and the only
  // next action offered was to fix two files that were both correct.
  it(`should name the generated file the project is missing, and the command that writes it`, async () => {
    const projectRoot = await setupTypeScriptProjectAsync();
    // The tsconfig `create-expo` scaffolds: it includes a file the Expo CLI generates.
    await fs.promises.writeFile(
      path.join(projectRoot, 'tsconfig.json'),
      JSON.stringify({ include: ['**/*.ts', '**/*.tsx', 'expo-env.d.ts'] })
    );

    const result = await executeAgentCliAsync(projectRoot, ['typecheck', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(20);
    const payload = JSON.parse(result.stdout);
    expect(payload.generatedTypes).toEqual({
      file: 'expo-env.d.ts',
      referencedBy: 'tsconfig.json',
      command: 'npx @expo/agent-cli dev --detach --wait-ready',
    });
    // The rung that can work comes first, and the one that says "fix the diagnostics" is gone.
    expect(payload.followups.map((followup: any) => followup.id)).toEqual([
      'typecheck-generate-types',
      'typecheck-rerun',
    ]);
  });

  it(`should print that note above the diagnostics in the human report`, async () => {
    const projectRoot = await setupTypeScriptProjectAsync();
    await fs.promises.writeFile(
      path.join(projectRoot, 'tsconfig.json'),
      JSON.stringify({ include: ['**/*.ts', 'expo-env.d.ts'] })
    );

    const result = await executeAgentCliAsync(projectRoot, ['typecheck'], { reject: false });

    expect(result.stdout).toContain('expo-env.d.ts is missing');
    expect(result.stdout.indexOf('expo-env.d.ts is missing')).toBeLessThan(
      result.stdout.indexOf('src/app/notes.tsx')
    );
    // The `Suggested next:` section goes to stdout in text mode, like the report above it.
    expect(result.stdout).toContain('npx @expo/agent-cli dev --detach --wait-ready');
  });

  it(`should say nothing about it once that file exists`, async () => {
    const projectRoot = await setupTypeScriptProjectAsync();
    await fs.promises.writeFile(
      path.join(projectRoot, 'tsconfig.json'),
      JSON.stringify({ include: ['**/*.ts', 'expo-env.d.ts'] })
    );
    await fs.promises.writeFile(
      path.join(projectRoot, 'expo-env.d.ts'),
      '/// <reference types="expo/types" />'
    );

    const result = await executeAgentCliAsync(projectRoot, ['typecheck', '--json'], {
      reject: false,
    });

    expect(JSON.parse(result.stdout).generatedTypes).toBeNull();
  });

  it(`should exit 0 when the project type-checks`, async () => {
    const projectRoot = await setupTypeScriptProjectAsync();

    const result = await executeAgentCliAsync(projectRoot, ['typecheck', '--json'], {
      env: { STUB_TSC_MODE: 'clean' },
    });

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload).toMatchObject({ checked: true, errorCount: 0, errors: [], reason: null });
    expect(payload.followups.map((followup: any) => followup.id)).toEqual([
      'typecheck-smoke',
      'typecheck-runtime-errors',
    ]);
  });

  // `--pretty` is a compiler option as well as a flag, so a project can print the other form
  // whatever this CLI asks for. A parser that only knew one would report "no errors" for it.
  it(`should read the pretty form to the same answer`, async () => {
    const projectRoot = await setupTypeScriptProjectAsync();

    const result = await executeAgentCliAsync(projectRoot, ['typecheck', '--json'], {
      reject: false,
      env: { STUB_TSC_MODE: 'pretty' },
    });

    expect(result.exitCode).toBe(20);
    const payload = JSON.parse(result.stdout);
    expect(payload.errorCount).toBe(1);
    expect(payload.errors[0]).toEqual({
      file: 'src/app/notes.tsx',
      line: 66,
      column: 22,
      code: 'TS2339',
      message: `Property 'md' does not exist on type '{ readonly two: 8; }'.`,
    });
  });

  // A gate that went red for the absence of TypeScript would be red for every JavaScript project
  // forever, and a red that is not about the code is a red nobody can act on.
  it(`should exit 0 and check nothing in a project without TypeScript`, async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeAgentCliAsync(projectRoot, ['typecheck', '--json']);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.checked).toBe(false);
    expect(payload.reason).toContain('no TypeScript in it');
    expect(payload.errors).toEqual([]);
    expect(payload.followups.map((followup: any) => followup.id)).toEqual(['typecheck-not-run']);
  });

  // @ref llp/0010-agent-conventions.rfc.md §The fourth: `typecheck` — the state between the two
  // above. A `tsconfig.json` with no compiler behind it is a broken setup, and reporting it as
  // "nothing to check" passed every gate that reads the exit code [F43, friction run 4].
  it(`should exit 1 on a TypeScript project whose compiler is missing`, async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    await fs.promises.writeFile(path.join(projectRoot, 'tsconfig.json'), '{}');

    const result = await executeAgentCliAsync(projectRoot, ['typecheck', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    const { error } = JSON.parse(result.stdout);
    expect(error.code).toBe('TYPECHECK_CLI_MISSING');
    expect(error.suggestedCommand).toBe('npx @expo/agent-cli install typescript --dev');
    // The two reasons must not read the same: that is the whole finding.
    expect(error.message).not.toContain('nothing to type-check');
  });

  // A compiler that failed without reporting a diagnostic has not answered the question, so it is
  // the tool failing and not a verdict on the code — exit 1, with the envelope.
  it(`should exit 1 when the compiler failed without reporting anything`, async () => {
    const projectRoot = await setupTypeScriptProjectAsync();

    const result = await executeAgentCliAsync(projectRoot, ['typecheck', '--json'], {
      reject: false,
      env: { STUB_TSC_MODE: 'unreadable' },
    });

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).error).toMatchObject({ code: 'TYPECHECK_FAILED' });
    expect(result.stderr).toContain('Killed: 9');
  });

  it(`should print the human report as labelled lines`, async () => {
    const projectRoot = await setupTypeScriptProjectAsync();

    const result = await executeAgentCliAsync(projectRoot, ['typecheck'], { reject: false });

    expect(result.exitCode).toBe(20);
    expect(result.stdout).toContain('Typecheck');
    expect(result.stdout).toContain('src/app/notes.tsx:66:22');
    expect(result.stdout).toContain('TS2339');
    expect(result.stdout).toContain('Suggested next:');
  });

  it(`should appear in the top-level help`, async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeAgentCliAsync(projectRoot, ['--help']);

    expect(result.stdout).toContain('typecheck');
  });

  // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope — this command parsed its
  // own options before the envelope machinery engaged, so a bad flag printed a bare sentence on
  // stderr and nothing at all on stdout [F44, friction run 4].
  it(`should print the JSON error envelope for an option it does not have`, async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeAgentCliAsync(projectRoot, ['typecheck', '--json', '--bogus'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    const { error } = JSON.parse(result.stdout);
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('--bogus');
    expect(error.suggestedCommand).toBe('npx @expo/agent-cli typecheck --help');
    expect(result.stderr).toContain('CommandError');
  });
});

// @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts — one central fix, so every
// command answers a bad option the same way [F47, friction run 4].
describe('unknown options across commands', () => {
  it(`should name the command own help when smoke is given an option it has not`, async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeAgentCliAsync(projectRoot, ['smoke', '--bogus', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).error.suggestedCommand).toBe('npx @expo/agent-cli smoke --help');
  });

  // The sugar itself: `--port` is what the caller has in hand after `@expo/agent-cli dev --port`.
  it(`should accept smoke --port as the dev server on that port`, async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeAgentCliAsync(
      projectRoot,
      // `--no-start`, so this stays a question about the flag: without it the run would try to
      // start a dev server on that port and the first phase would be the start rather than the
      // discovery whose URL this is checking.
      ['smoke', '--port', '65533', '--no-start', '--timeout', '1s', '--json'],
      { reject: false }
    );

    // Nothing listens there, so the gate fails on its first phase — and the URL that phase names
    // is the one the port spells, which is the proof that the flag was understood rather than
    // rejected as unknown.
    const report = JSON.parse(result.stdout);
    expect(report.outcome).toBe('failed');
    expect(report.phases[0]).toMatchObject({ id: 'dev-server', status: 'failed' });
    expect(report.phases[0].reason).toContain('http://127.0.0.1:65533');
  });

  it(`should tell runtime:stop --platform ios apart from an unknown option`, async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeAgentCliAsync(
      projectRoot,
      ['runtime:stop', '--platform', 'ios', '--port', '65533', '--json'],
      { reject: false }
    );

    expect(result.stdout).not.toContain('Unknown option');
  });
});
