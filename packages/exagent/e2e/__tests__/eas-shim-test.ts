/* eslint-env jest */
// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — every CLI of the family is reached
// across a process boundary, so what answers a spawn is whatever this machine has under that name.
//
// This file asks one question of every command that spawns `eas`: when the binary under that name
// was never the EAS CLI, does the command say so, or does it report the wrapper's bytes as the
// service's answer? The second is the failure `src/utils/wrapperCrash.ts` exists to prevent, and it
// is worth a suite of its own because the guard is applied per call site — a site that forgot it
// looks exactly like a site that has it, right up until a shim is on `PATH`.
//
// The machine these tests were written on has such a shim, which is how the class was found.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  installStubBinAsync,
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

/** Copy a fixture and put a binary that is not the EAS CLI under the name `eas`. */
async function setupWithBrokenEasAsync(fixture = 'dev-client-fresh-app'): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixture);
  await installStubFingerprintAsync(projectRoot);

  const binDir = path.join(projectRoot, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });
  const easStub = path.join(binDir, 'eas-wrapper-crash-stub.js');
  await fs.promises.writeFile(easStub, STUB_EAS_WRAPPER_CRASH);
  const fingerprintStub = path.join(binDir, 'fingerprint-platform-stub.js');
  await fs.promises.writeFile(fingerprintStub, STUB_FINGERPRINT);

  for (const dir of [binDir, path.join(projectRoot, 'node_modules', '.bin')]) {
    await installStubBinAsync(dir, 'eas', easStub);
    await installStubBinAsync(dir, 'fingerprint', fingerprintStub);
  }
  return projectRoot;
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
  it('is named rather than quoted by the EAS build lookup of status --explain', async () => {
    const projectRoot = await setupWithBrokenEasAsync();

    const result = await executeExagentAsync(projectRoot, ['status', '--explain', '--json']);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    const reasons = report.builds.platforms.map((platform: { reason: string }) => platform.reason);
    // Every platform is `unknown`, which is right: nothing was established about this account.
    expect(report.builds.platforms.map((p: { state: string }) => p.state)).toEqual([
      'unknown',
      'unknown',
    ]);
    // What is wrong is quoting the wrapper. The reader has to be sent to the file that ran.
    for (const reason of reasons) {
      expect(reason).not.toContain('panicked');
      expect(reason).not.toContain('rust_begin_unwind');
      expect(reason).toContain('may not be the real CLI');
    }
    expect(everything(result.stdout)).not.toContain('rust_begin_unwind');
  });

  // The other EAS-backed read of `status`: `--build <id>` compares the working tree against the
  // fingerprint the service computed for one build. `status` promises information rather than
  // judgment (llp/0015 §Validation), so the failure lands in `errors.freshness` and the command
  // still exits 0 — which makes that string the whole of what a reader gets, and its "How" line
  // used to tell them to check the id and their sign-in, neither of which is the problem.
  it('is named rather than quoted by status --explain --build', async () => {
    const projectRoot = await setupWithBrokenEasAsync();

    const result = await executeExagentAsync(projectRoot, [
      'status',
      '--explain',
      '--build',
      BUILD_ID,
      '--json',
    ]);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.errors.freshness).toContain('may not be the real CLI');
    expect(report.errors.freshness).not.toContain('rust_begin_unwind');
    // The advice that does not apply is gone with it: nothing here is about the build id.
    expect(report.errors.freshness).not.toContain('signed in to the account');
  });

  // @ref src/passthrough/auth.ts §`isRealEasCliAsync`
  // The auth chain is the one call site that had the guard already, and this pins the property it
  // buys: a shim on `PATH` is *skipped* rather than run, so the answer comes from the package
  // runner. `auth-test.ts` covers the chain's other rungs; this is the rung that only exists
  // because a binary under that name may be something else.
  it('is skipped by the auth chain, which falls through to the package runner', async () => {
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
