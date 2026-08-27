/* eslint-env jest */
// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — every CLI of the family is reached
// across a process boundary, so what answers a spawn is whatever this machine has under that name.
// @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI
//
// This file used to ask one question of every command that spawns `eas`: when the binary under that
// name was never the EAS CLI, does the command say so, or does it report the wrapper's bytes as the
// service's answer? The machine these tests were written on has such a shim, which is how the class
// was found, and the guard against it (`src/utils/wrapperCrash.ts`) was applied per call site.
//
// **Wave 18 removed the premise.** The EAS CLI is reached one way — `npx --yes eas-cli`, or `bunx` —
// and a runner resolves a *package*, so a file called `eas` is never spawned however broken it is.
// So the question this file asks now is the stronger one: with a wrapper installed under that name
// in both places the old resolver looked, is it left alone? Plus one test of the guard itself, which
// is kept precisely because "unreachable" is a claim about today's resolver.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  installStubBinAsync,
  installStubEasRunnerAsync,
  installStubFingerprintAsync,
  setupFixtureAsync,
} from '../utils';

/**
 * An `eas` that is not the EAS CLI: a wrapper that panics before it runs anything.
 *
 * Both halves of `looksLikeWrapperCrash` are present, because both are required — a Rust panic on
 * stderr and the exit code a panic leaves — and nothing an EAS run would print is.
 */
const STUB_EAS_WRAPPER_CRASH = `#!/usr/bin/env node
'use strict';
process.stderr.write("thread 'main' panicked at src/main.rs:41:9:\\n");
process.stderr.write('called \`Option::unwrap()\` on a \`None\` value\\n');
process.stderr.write('note: run with \`RUST_BACKTRACE=1\`\\n');
process.stderr.write('Stack backtrace:\\n   0: rust_begin_unwind\\n');
process.exit(101);
`;

/**
 * The per-platform `fingerprint` bin the EAS build lookup needs.
 *
 * The lookup hashes one platform before it asks about it, so a project whose fingerprint cannot be
 * computed never reaches the `eas` spawn at all — which would make this whole file pass for the
 * wrong reason.
 */
const STUB_FINGERPRINT = `#!/usr/bin/env node
'use strict';
const args = process.argv.slice(2);
const platform = args.includes('--platform') ? args[args.indexOf('--platform') + 1] : null;
const hash = platform === 'ios'
  ? 'aaaa1111bbbb2222cccc3333dddd4444eeee5555'
  : platform === 'android'
    ? 'ffff6666eeee7777dddd8888cccc9999bbbb0000'
    : '0f1e2d3c4b5a69788796a5b4c3d2e1f001234567';
process.stdout.write(JSON.stringify({ hash, sources: [] }) + '\\n');
`;

/** A build id in the shape the service issues, for the comparison flag. */
const BUILD_ID = '21d7d434-6495-4e74-b8c7-68ecd0dff489';

/** Where a run of the broken `eas` records itself, so "it was never spawned" is checkable. */
const RAN_MARKER = 'broken-eas-ran.txt';

/**
 * Copy a fixture, put a binary that is not the EAS CLI under the name `eas` in both places the old
 * resolver looked, and put a stub package runner beside them.
 *
 * The runner answers as the EAS CLI would for the two reads under test. The broken `eas` records
 * that it ran before it panics — a file that stays absent is the assertion.
 */
async function setupWithBrokenEasAsync(
  fixture = 'dev-client-fresh-app',
  { runnerScript }: { runnerScript?: string } = {}
): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixture);
  await installStubFingerprintAsync(projectRoot);

  const binDir = path.join(projectRoot, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });
  const easStub = path.join(binDir, 'eas-wrapper-crash-stub.js');
  await fs.promises.writeFile(
    easStub,
    `require('node:fs').writeFileSync(${JSON.stringify(path.join(projectRoot, RAN_MARKER))}, 'ran');\n` +
      STUB_EAS_WRAPPER_CRASH
  );
  const fingerprintStub = path.join(binDir, 'fingerprint-platform-stub.js');
  await fs.promises.writeFile(fingerprintStub, STUB_FINGERPRINT);

  for (const dir of [binDir, path.join(projectRoot, 'node_modules', '.bin')]) {
    await installStubBinAsync(dir, 'eas', easStub);
    await installStubBinAsync(dir, 'fingerprint', fingerprintStub);
  }

  // The package the runner resolves. Answers `build:list` with an empty array and
  // `fingerprint:compare` with a payload the reader can parse, which is all these two reads need.
  const packageScript = path.join(binDir, 'eas-package-stub.js');
  await fs.promises.writeFile(
    packageScript,
    runnerScript ??
      `#!/usr/bin/env node
'use strict';
const args = process.argv.slice(2);
if (args[0] === 'build:list') {
  process.stdout.write('[]\\n');
} else if (args[0] === 'fingerprint:compare') {
  process.stdout.write(JSON.stringify({ fingerprint1: { hash: 'a' }, fingerprint2: { hash: 'a' } }) + '\\n');
} else if (args[0] === 'build:view') {
  process.stdout.write(JSON.stringify({ id: 'b', platform: 'IOS' }) + '\\n');
} else {
  process.stdout.write('e2e-user\\n');
}
`
  );
  await installStubEasRunnerAsync(binDir, packageScript);
  return projectRoot;
}

/** Whether the binary that was never the EAS CLI was spawned at all. */
function brokenEasRan(projectRoot: string): boolean {
  return fs.existsSync(path.join(projectRoot, RAN_MARKER));
}

/** The whole of a report as one string, for the "is this anywhere in the output" assertions. */
function everything(stdout: string): string {
  return stdout;
}

describe('a binary under the name `eas` that was never the EAS CLI', () => {
  // @ref llp/0011-impact-and-freshness.rfc.md §The three comparisons
  // The build lookup never fails a command — every failure is an `unknown` with a reason attached —
  // and the reason is printed as what EAS answered. A panic quoted there is a sentence about this
  // account's builds that no Expo service ever said.
  it('is left alone by the EAS build lookup of status --explain, which uses the runner', async () => {
    const projectRoot = await setupWithBrokenEasAsync();

    const result = await executeExagentAsync(projectRoot, ['status', '--explain', '--json']);

    expect(result.exitCode).toBe(0);
    // The point: the wrapper was never given the chance to say anything.
    expect(brokenEasRan(projectRoot)).toBe(false);
    const report = JSON.parse(result.stdout);
    // And the answer is EAS's — `none` is the service saying there is no such build, where before
    // wave 18 every platform was `unknown` with the wrapper named in the reason.
    expect(report.builds.platforms.map((p: { state: string }) => p.state)).toEqual(['none', 'none']);
    expect(everything(result.stdout)).not.toContain('rust_begin_unwind');
  });

  // The other EAS-backed read of `status`: `--build <id>` compares the working tree against the
  // fingerprint the service computed for one build.
  it('is left alone by status --explain --build', async () => {
    const projectRoot = await setupWithBrokenEasAsync();

    const result = await executeExagentAsync(projectRoot, [
      'status',
      '--explain',
      '--build',
      BUILD_ID,
      '--json',
    ]);

    expect(result.exitCode).toBe(0);
    expect(brokenEasRan(projectRoot)).toBe(false);
    expect(result.all).not.toContain('rust_begin_unwind');
  });

  // The guard, kept because "unreachable" is a claim about today's resolver and not about the
  // process boundary. Reached here by making the *package* answer the way a wrapper dies.
  it('is still named rather than quoted when the package itself answers like a wrapper', async () => {
    const projectRoot = await setupWithBrokenEasAsync('dev-client-fresh-app', {
      runnerScript: STUB_EAS_WRAPPER_CRASH,
    });

    const result = await executeExagentAsync(projectRoot, ['status', '--explain', '--json']);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    for (const platform of report.builds.platforms) {
      expect(platform.state).toBe('unknown');
      // The invocation, and never the panic, which is not a sentence about this account's builds.
      expect(platform.reason).toContain('may not be the real CLI');
      expect(platform.reason).not.toContain('panicked');
    }
    expect(everything(result.stdout)).not.toContain('rust_begin_unwind');
  });

  // @ref src/passthrough/auth.ts §resolveAuthCliAsync
  // The auth chain is where the probe that skipped a shim was written, and it is now the same one
  // rung as everything else: the shim is not skipped, it is never a candidate. `auth-test.ts` covers
  // the Expo side of that chain.
  it('is not a candidate for the auth chain, which uses the package runner', async () => {
    const directory = await fs.promises.realpath(
      await fs.promises.mkdtemp(path.join(require('node:os').tmpdir(), 'exagent-eas-shim-'))
    );
    const logFile = path.join(directory, 'npx-invocations.jsonl');
    const binDir = path.join(directory, 'path-bin');

    const easStub = path.join(directory, 'eas-wrapper-crash-stub.js');
    await fs.promises.writeFile(easStub, STUB_EAS_WRAPPER_CRASH);
    await installStubBinAsync(binDir, 'eas', easStub);

    // A stub `npx` that records what it was asked to run and answers instead of downloading.
    const npxStub = path.join(directory, 'npx-stub.js');
    await fs.promises.writeFile(
      npxStub,
      `#!/usr/bin/env node
'use strict';
require('node:fs').appendFileSync(
  ${JSON.stringify(logFile)},
  JSON.stringify({ args: process.argv.slice(2) }) + '\\n'
);
process.stdout.write('e2e-user\\n');
`
    );
    await installStubBinAsync(binDir, 'npx', npxStub);

    const result = await executeExagentAsync(directory, ['whoami'], {
      env: { PATH: [binDir, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter) },
      reject: false,
    });

    expect(result.exitCode).toBe(0);
    const invocations = fs
      .readFileSync(logFile, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { args: string[] });
    // `--yes` ahead of the package since wave 18: npx prompts before installing something it has
    // not seen, and this CLI never attaches stdin, so the prompt would be a hang.
    expect(invocations[0]!.args).toEqual(['--yes', 'eas-cli@latest', 'whoami']);
    expect(result.all).not.toContain('rust_begin_unwind');
  });
});
