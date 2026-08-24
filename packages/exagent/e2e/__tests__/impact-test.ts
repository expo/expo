/* eslint-env jest */
// @ref llp/0011-impact-and-freshness.rfc.md
//
// `exagent impact` drives three other programs — the project's `fingerprint` CLI twice, `expo
// config` once, and `eas` when there is one — so these tests run the published bin against stubs
// for all three and assert what crossed the process boundary: the exit code, the one JSON object
// on stdout, the argv each stub was handed, and the `cli:impact` event.
//
// The exit codes get their own tests, per llp/0010 §Testing: `--assert` is the only thing that
// makes this command non-zero on a healthy run, and a test that checked "some non-zero code"
// would pass while the distinction the band exists for was broken.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  installStubBinAsync,
  readStubExpoInvocations,
  setupFixtureAsync,
} from '../utils';

/** The shape `impact --json` prints, per `src/impact/types.ts`. */
type ImpactReport = {
  projectRoot: string;
  comparison: {
    kind: 'last-build' | 'eas-build' | 'git-refs';
    base: { label: string; hash: string | null };
    head: { label: string; hash: string | null };
    preset: string;
  };
  platforms: {
    platform: 'ios' | 'android' | null;
    class: string;
    fingerprintChanged: boolean | null;
    baseHash: string | null;
    headHash: string | null;
    changedSources: { op: string; type: string | null; path: string | null; reasons: string[]; kind: string; class: string }[];
    reasons: string[];
    cachedBuild: { id: string | null; status: string | null } | null;
    caveats: string[];
  }[];
  ota: {
    safe: boolean | null;
    runtimeVersion: { policy: string | null; literal: string | null; source: string | null };
    why: string;
  };
  class: string;
  changedFiles: { total: number; native: number; js: number; config: number } | null;
  caveats: string[];
  assertion: { asserted: string; ok: boolean } | null;
  followups: { id: string; command: string; why: string }[];
};

const STUB_EAS_LOG_NAME = 'stub-eas-invocations.jsonl';
const STUB_FINGERPRINT_LOG_NAME = 'stub-fingerprint-invocations.jsonl';

/** The hash the fresh fixture's `.expo/exagent-last-build.json` records, as a bare v1 string. */
const RECORDED_HASH = '0f1e2d3c4b5a69788796a5b4c3d2e1f001234567';

/** The hash the stub reports for a working tree that has moved. */
const CHANGED_HASH = 'ffffffffffffffffffffffffffffffffffffffff';

const BUILD_ID = '2f1c9f0e-6b1e-4a3d-9c1a-0b6f1e2d3c4a';

/**
 * Stub `fingerprint` bin covering both commands the wrapper spawns.
 *
 * `fingerprint:generate` prints one `{sources, hash}` object, and `fingerprint:diff` reads the two
 * files it is handed and prints an array — which is what makes the temp-file dance a real part of
 * what these tests cover, rather than something mocked away.
 *
 * Environment variables the tests steer it with:
 * - STUB_FP_HASH: the hash `generate` prints (default: the recorded one, i.e. unchanged)
 * - STUB_FP_DIFF: JSON array `diff` prints (default: one added autolinked native module)
 * - STUB_FP_EXIT_CODE: exit code to return instead of answering (default 0)
 */
const STUB_FINGERPRINT = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const cwd = process.cwd();
fs.appendFileSync(
  path.join(cwd, ${JSON.stringify(STUB_FINGERPRINT_LOG_NAME)}),
  JSON.stringify({ args, cwd, isTTY: !!process.stdout.isTTY }) + '\\n'
);

const exitCode = Number(process.env.STUB_FP_EXIT_CODE || 0);
if (exitCode !== 0) {
  process.stderr.write('stub fingerprint failed: Invalid project root\\n');
  process.exit(exitCode);
}

if (args[0] === 'fingerprint:diff') {
  // Read both sides, so a wrapper that wrote one of them wrongly fails here rather than silently.
  JSON.parse(fs.readFileSync(args[1], 'utf8'));
  JSON.parse(fs.readFileSync(args[2], 'utf8'));
  const fallback = JSON.stringify([
    {
      op: 'added',
      addedSource: {
        type: 'dir',
        filePath: 'node_modules/react-native-mmkv',
        reasons: ['rncoreAutolinkingIos'],
        hash: 'aabb',
      },
    },
  ]);
  process.stdout.write(JSON.stringify(JSON.parse(process.env.STUB_FP_DIFF || fallback), null, 2) + '\\n');
  process.exit(0);
}

const hash = process.env.STUB_FP_HASH || ${JSON.stringify(RECORDED_HASH)};
// A debug line on stderr, the way the real CLI logs: the parse must not depend on stdout being
// the only stream that was written to.
process.stderr.write('expo:fingerprint hashing project\\n');
process.stdout.write(JSON.stringify({ sources: [{ type: 'file', filePath: 'app.json', reasons: ['expoConfig'], hash: 'a1' }], hash }) + '\\n');
`;

/**
 * Stub `eas` bin covering the two commands `impact` may spawn.
 *
 * - STUB_EAS_COMPARE: JSON `fingerprint:compare --json` prints (default: an empty diff)
 * - STUB_EAS_BUILD_LIST: JSON `build:list --json` prints (default: `[]`, i.e. no cached build)
 * - STUB_EAS_EXIT_CODE: exit code to return instead of answering (default 0)
 */
const STUB_EAS = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const cwd = process.cwd();
fs.appendFileSync(
  path.join(cwd, ${JSON.stringify(STUB_EAS_LOG_NAME)}),
  JSON.stringify({ args, cwd, isTTY: !!process.stdin.isTTY }) + '\\n'
);

const exitCode = Number(process.env.STUB_EAS_EXIT_CODE || 0);
if (exitCode !== 0) {
  process.stderr.write('Build not found: no build with that ID exists for this account.\\n');
  process.exit(exitCode);
}

process.stderr.write('Fetching…\\n');
if (args[0] === 'fingerprint:compare') {
  process.stdout.write((process.env.STUB_EAS_COMPARE || '[]') + '\\n');
  process.exit(0);
}
if (args[0] === 'build:list') {
  process.stdout.write((process.env.STUB_EAS_BUILD_LIST || '[]') + '\\n');
  process.exit(0);
}
process.stderr.write('stub eas: unexpected command ' + args[0] + '\\n');
process.exit(1);
`;

type StubInvocation = { args: string[]; cwd: string; isTTY: boolean };

/**
 * Copy a fixture and install the stubs into `.stub-bin` (which the runner puts on `PATH`) and into
 * `node_modules/.bin`, which is where the wrapper looks for the project's own `fingerprint`.
 */
async function setupAsync(fixture = 'dev-client-fresh-app'): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixture);
  const binDir = path.join(projectRoot, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });

  const fingerprintStub = path.join(binDir, 'fingerprint-stub.js');
  await fs.promises.writeFile(fingerprintStub, STUB_FINGERPRINT);
  const easStub = path.join(binDir, 'eas-stub.js');
  await fs.promises.writeFile(easStub, STUB_EAS);

  for (const dir of [binDir, path.join(projectRoot, 'node_modules', '.bin')]) {
    await installStubBinAsync(dir, 'fingerprint', fingerprintStub);
    await installStubBinAsync(dir, 'eas', easStub);
  }

  // The real path, because that is what a subprocess reports as its working directory: on macOS
  // the temporary directory is reached through a symlink.
  return fs.promises.realpath(projectRoot);
}

/** Write the payload the stub `expo config` prints, and the env that points it there. */
async function writeAppConfigAsync(
  projectRoot: string,
  runtimeVersion: unknown
): Promise<Record<string, string>> {
  const payloadPath = path.join(projectRoot, 'stub-expo-config.json');
  await fs.promises.writeFile(
    payloadPath,
    JSON.stringify({ name: 'fresh', slug: 'fresh', runtimeVersion })
  );
  return { STUB_EXPO_CONFIG_JSON: payloadPath };
}

function readStubInvocations(projectRoot: string, name: string): StubInvocation[] {
  const logPath = path.join(projectRoot, name);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/** The `cli:*` events of one run, from the JSONL stream. */
function readEvents(projectRoot: string, logPath: string): { _e: string; [key: string]: any }[] {
  const absolute = path.join(projectRoot, logPath);
  if (!fs.existsSync(absolute)) {
    return [];
  }
  return fs
    .readFileSync(absolute, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function runImpactAsync(
  projectRoot: string,
  args: string[],
  env: Record<string, string> = {}
) {
  return executeExagentAsync(projectRoot, ['impact', ...args], {
    env: { ...(await writeAppConfigAsync(projectRoot, { policy: 'appVersion' })), ...env },
    reject: false,
  });
}

describe('exagent impact', () => {
  it(`should classify an added native module as needs-native-build and exit 0`, async () => {
    const projectRoot = await setupAsync();

    const result = await runImpactAsync(projectRoot, ['--platform', 'ios', '--json'], {
      STUB_FP_HASH: CHANGED_HASH,
    });

    expect(result.exitCode).toBe(0);
    const report: ImpactReport = JSON.parse(result.stdout);
    expect(report.class).toBe('needs-native-build');
    expect(report.platforms).toHaveLength(1);
    expect(report.platforms[0]).toMatchObject({
      platform: 'ios',
      class: 'needs-native-build',
      fingerprintChanged: true,
      baseHash: RECORDED_HASH,
      headHash: CHANGED_HASH,
    });
  });

  it(`pins the top-level keys of the payload`, async () => {
    // llp/0006 §Output contract: the top-level keys are the de-facto version of this command, and
    // this asserts them through the published bin rather than through the builder.
    const projectRoot = await setupAsync();

    const result = await runImpactAsync(projectRoot, ['--platform', 'ios', '--json']);

    expect(Object.keys(JSON.parse(result.stdout))).toEqual([
      'projectRoot',
      'comparison',
      'platforms',
      'ota',
      'class',
      'changedFiles',
      'caveats',
      'assertion',
      'followups',
    ]);
  });

  it(`should spawn the fingerprint CLI with the platform and preset it was given`, async () => {
    const projectRoot = await setupAsync();

    await runImpactAsync(projectRoot, ['--platform', 'android', '--preset', 'strict', '--json'], {
      STUB_FP_HASH: CHANGED_HASH,
    });

    const invocations = readStubInvocations(projectRoot, STUB_FINGERPRINT_LOG_NAME);
    expect(invocations[0]!.args).toEqual([
      'fingerprint:generate',
      projectRoot,
      '--platform',
      'android',
      '--preset',
      'strict',
    ]);
  });

  it(`should say a v1 record answers whether, and not what`, async () => {
    // The fixture's record is a bare string, which is the shape this CLI wrote before v2. It has
    // to keep working, and it has to say what it cannot do.
    const projectRoot = await setupAsync();

    const result = await runImpactAsync(projectRoot, ['--platform', 'ios', '--json'], {
      STUB_FP_HASH: CHANGED_HASH,
    });

    const report: ImpactReport = JSON.parse(result.stdout);
    expect(report.platforms[0]!.fingerprintChanged).toBe(true);
    expect(report.platforms[0]!.changedSources).toEqual([]);
    expect(report.caveats.join(' ')).toContain('only a hash');
    // …and no diff was ever attempted, because there was nothing to diff against.
    const invocations = readStubInvocations(projectRoot, STUB_FINGERPRINT_LOG_NAME);
    expect(invocations.map((invocation) => invocation.args[0])).toEqual(['fingerprint:generate']);
  });

  it(`should diff against a v2 record and name what changed`, async () => {
    const projectRoot = await setupAsync();
    // A v2 record: the whole fingerprint, which is what `exagent dev` writes now.
    await fs.promises.writeFile(
      path.join(projectRoot, '.expo', 'exagent-last-build.json'),
      JSON.stringify({
        ios: {
          hash: RECORDED_HASH,
          sources: [{ type: 'file', filePath: 'app.json', reasons: ['expoConfig'], hash: 'a1' }],
        },
      })
    );

    const result = await runImpactAsync(projectRoot, ['--platform', 'ios', '--json'], {
      STUB_FP_HASH: CHANGED_HASH,
    });

    const report: ImpactReport = JSON.parse(result.stdout);
    expect(report.platforms[0]!.changedSources).toEqual([
      {
        op: 'added',
        type: 'dir',
        path: 'node_modules/react-native-mmkv',
        reasons: ['rncoreAutolinkingIos'],
        kind: 'native-module',
        class: 'needs-native-build',
      },
    ]);
    expect(report.platforms[0]!.reasons.join(' ')).toContain('react-native-mmkv');

    const invocations = readStubInvocations(projectRoot, STUB_FINGERPRINT_LOG_NAME);
    expect(invocations.map((invocation) => invocation.args[0])).toEqual([
      'fingerprint:generate',
      'fingerprint:diff',
    ]);
    // Two temp files, both outside the project, and both gone afterwards.
    const [, diff] = invocations;
    expect(diff!.args).toHaveLength(3);
    expect(fs.existsSync(diff!.args[1]!)).toBe(false);
    expect(fs.existsSync(diff!.args[2]!)).toBe(false);
  });

  it(`should report an unchanged fingerprint as js-only`, async () => {
    const projectRoot = await setupAsync();

    const result = await runImpactAsync(projectRoot, ['--platform', 'ios', '--json']);

    const report: ImpactReport = JSON.parse(result.stdout);
    expect(report.platforms[0]!.fingerprintChanged).toBe(false);
    expect(report.class).toBe('js-only');
  });

  describe('the OTA verdict comes from the policy, not the class', () => {
    it(`should report an unsafe update for a native change under the appVersion policy`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--platform', 'ios', '--json'], {
        STUB_FP_HASH: CHANGED_HASH,
      });

      const report: ImpactReport = JSON.parse(result.stdout);
      expect(report.class).toBe('needs-native-build');
      expect(report.ota.safe).toBe(false);
      expect(report.ota.runtimeVersion).toEqual({
        policy: 'appVersion',
        literal: null,
        source: 'expo config --type public',
      });
    });

    it(`should report the same change as safe under the fingerprint policy`, async () => {
      const projectRoot = await setupAsync();
      const env = await writeAppConfigAsync(projectRoot, { policy: 'fingerprint' });

      const result = await executeExagentAsync(
        projectRoot,
        ['impact', '--platform', 'ios', '--json'],
        { env: { ...env, STUB_FP_HASH: CHANGED_HASH }, reject: false }
      );

      const report: ImpactReport = JSON.parse(result.stdout);
      expect(report.class).toBe('needs-native-build');
      expect(report.ota.safe).toBe(true);
    });

    it(`should ask expo config for the public config`, async () => {
      const projectRoot = await setupAsync();

      await runImpactAsync(projectRoot, ['--platform', 'ios', '--json']);

      const configRuns = readStubExpoInvocations(projectRoot).filter(
        (invocation) => invocation.args[0] === 'config'
      );
      expect(configRuns).toHaveLength(1);
      expect(configRuns[0]!.args).toEqual(['config', '--json', '--type', 'public']);
      // Captured, so the CLI is told nobody can answer it (llp/0010 §Force non-interactive).
      expect(configRuns[0]!.ci).toBe('1');
      expect(configRuns[0]!.isTTY).toBe(false);
    });
  });

  describe('--assert', () => {
    it(`should exit 20 when the real class is stronger than the asserted one`, async () => {
      // llp/0010 §Exit codes: the tool worked and the gate did not pass, which is the 20-29 band.
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(
        projectRoot,
        ['--platform', 'ios', '--assert', 'js-only', '--json'],
        { STUB_FP_HASH: CHANGED_HASH }
      );

      expect(result.exitCode).toBe(20);
      const report: ImpactReport = JSON.parse(result.stdout);
      expect(report.assertion).toEqual({ asserted: 'js-only', ok: false });
    });

    it(`should exit 0 when the real class is at most the asserted one`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(
        projectRoot,
        ['--platform', 'ios', '--assert', 'needs-native-build', '--json'],
        { STUB_FP_HASH: CHANGED_HASH }
      );

      expect(result.exitCode).toBe(0);
      expect((JSON.parse(result.stdout) as ImpactReport).assertion!.ok).toBe(true);
    });

    it(`should still print the whole report on the run that exits 20`, async () => {
      // The exit code is the answer; the payload is why. Losing one of the two would make the
      // gate unreadable.
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(
        projectRoot,
        ['--platform', 'ios', '--assert', 'js-only', '--json'],
        { STUB_FP_HASH: CHANGED_HASH }
      );

      const report: ImpactReport = JSON.parse(result.stdout);
      expect(report.class).toBe('needs-native-build');
      expect(report.ota.why).toBeTruthy();
    });
  });

  describe('--build', () => {
    it(`should ask eas to compare against the build, non-interactively`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--build', BUILD_ID, '--json'], {
        STUB_EAS_COMPARE: '[]',
      });

      expect(result.exitCode).toBe(0);
      const invocations = readStubInvocations(projectRoot, STUB_EAS_LOG_NAME);
      expect(invocations[0]!.args).toEqual([
        'fingerprint:compare',
        '--build-id',
        BUILD_ID,
        '--json',
        '--non-interactive',
      ]);
      expect(invocations[0]!.isTTY).toBe(false);
    });

    it(`should run the comparison once, not once per platform`, async () => {
      // `eas fingerprint:compare --build-id` takes no platform, so running it per platform would
      // spawn the identical command twice and report one answer as two.
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--build', BUILD_ID, '--json']);

      const report: ImpactReport = JSON.parse(result.stdout);
      expect(report.platforms).toHaveLength(1);
      expect(report.platforms[0]!.platform).toBeNull();
      expect(
        readStubInvocations(projectRoot, STUB_EAS_LOG_NAME).filter(
          (invocation) => invocation.args[0] === 'fingerprint:compare'
        )
      ).toHaveLength(1);
    });

    it(`should never spawn the fingerprint CLI in this mode`, async () => {
      const projectRoot = await setupAsync();

      await runImpactAsync(projectRoot, ['--build', BUILD_ID, '--json']);

      expect(readStubInvocations(projectRoot, STUB_FINGERPRINT_LOG_NAME)).toEqual([]);
    });

    it(`should read a diff eas printed and classify it`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--build', BUILD_ID, '--json'], {
        STUB_EAS_COMPARE: JSON.stringify([
          {
            op: 'added',
            addedSource: {
              type: 'dir',
              filePath: 'node_modules/expo-camera',
              reasons: ['expoAutolinkingIos'],
            },
          },
        ]),
      });

      const report: ImpactReport = JSON.parse(result.stdout);
      expect(report.comparison.kind).toBe('eas-build');
      expect(report.comparison.base.label).toBe(`EAS build ${BUILD_ID}`);
      expect(report.class).toBe('needs-native-build');
      expect(report.platforms[0]!.changedSources[0]!.kind).toBe('native-module');
    });

    it(`should carry a caveat rather than failing on a payload shape it does not know`, async () => {
      // The `--json` shape of `eas fingerprint:compare` is unverified, so an unrecognised payload
      // has to degrade to what it can read and say so, not end the command.
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--build', BUILD_ID, '--json'], {
        STUB_EAS_COMPARE: JSON.stringify({ somethingNobodyExpected: true }),
      });

      expect(result.exitCode).toBe(0);
      const report: ImpactReport = JSON.parse(result.stdout);
      expect(report.caveats.join(' ')).toContain('shape this CLI does not recognise');
    });

    it(`should exit 1 with the id when eas could not read the build`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--build', BUILD_ID, '--json'], {
        STUB_EAS_EXIT_CODE: '1',
      });

      expect(result.exitCode).toBe(1);
      // llp/0010 §The `--json` error envelope: one object on stdout, whether it worked or not.
      expect(JSON.parse(result.stdout).error).toMatchObject({ code: 'IMPACT_COMPARE_FAILED' });
      expect(result.stderr).toContain(BUILD_ID);
    });
  });

  describe('the build-cache lookup', () => {
    it(`should ask EAS for a finished build with this exact fingerprint`, async () => {
      const projectRoot = await setupAsync();

      await runImpactAsync(projectRoot, ['--platform', 'ios', '--json'], {
        STUB_FP_HASH: CHANGED_HASH,
      });

      const lookups = readStubInvocations(projectRoot, STUB_EAS_LOG_NAME).filter(
        (invocation) => invocation.args[0] === 'build:list'
      );
      expect(lookups).toHaveLength(1);
      expect(lookups[0]!.args).toEqual([
        'build:list',
        '--platform',
        'ios',
        '--fingerprint-hash',
        CHANGED_HASH,
        '--status',
        'finished',
        '--limit',
        '1',
        '--json',
        '--non-interactive',
      ]);
    });

    it(`should turn a hit into the follow-up that installs it`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--platform', 'ios', '--json'], {
        STUB_FP_HASH: CHANGED_HASH,
        STUB_EAS_BUILD_LIST: JSON.stringify([
          { id: 'cached-1', status: 'FINISHED', platform: 'IOS', buildProfile: 'development' },
        ]),
      });

      const report: ImpactReport = JSON.parse(result.stdout);
      expect(report.platforms[0]!.cachedBuild).toMatchObject({ id: 'cached-1', status: 'FINISHED' });
      expect(report.followups[0]).toMatchObject({ id: 'impact-cached-build' });
      expect(report.followups[0]!.command).toContain('cached-1');
    });

    it(`should not ask when nothing would need a build`, async () => {
      const projectRoot = await setupAsync();

      await runImpactAsync(projectRoot, ['--platform', 'ios', '--json']);

      expect(
        readStubInvocations(projectRoot, STUB_EAS_LOG_NAME).filter(
          (invocation) => invocation.args[0] === 'build:list'
        )
      ).toEqual([]);
    });

    it(`should exit 0 when the lookup itself fails`, async () => {
      // A network failure must never fail the command: the report is complete without this line.
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--platform', 'ios', '--json'], {
        STUB_FP_HASH: CHANGED_HASH,
        STUB_EAS_EXIT_CODE: '1',
      });

      expect(result.exitCode).toBe(0);
      const report: ImpactReport = JSON.parse(result.stdout);
      expect(report.class).toBe('needs-native-build');
      expect(report.platforms[0]!.cachedBuild).toBeNull();
    });
  });

  describe('errors', () => {
    it(`should exit 1 when the project has no fingerprint CLI`, async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['impact', '--json'], {
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('@expo/fingerprint');
      expect(JSON.parse(result.stdout).error.code).toBe('IMPACT_COMPARE_FAILED');
    });

    it(`should exit 1 when the fingerprint CLI failed`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--platform', 'ios', '--json'], {
        STUB_FP_EXIT_CODE: '1',
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid project root');
    });

    it(`should reject a platform with no native surface`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--platform', 'web', '--json']);

      expect(result.exitCode).toBe(1);
      expect(JSON.parse(result.stdout).error.code).toBe('BAD_ARGS');
      expect(result.stderr).toContain('no native surface');
    });

    it(`should reject a stray positional argument and name the flag that carries it`, async () => {
      // llp/0010 §Registry rules (d): a dropped argument is indistinguishable from an understood
      // one, which is the answer a driving agent cannot recover from.
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, [BUILD_ID, '--json']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('--build');
    });

    it(`should reject --build together with --base`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, [
        '--build',
        BUILD_ID,
        '--base',
        'HEAD~1',
        '--json',
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('only one comparison runs');
    });

    it(`should say plainly that --base is not implemented, and name what is`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--base', 'HEAD~1', '--json']);

      expect(result.exitCode).toBe(1);
      expect(JSON.parse(result.stdout).error.code).toBe('IMPACT_MODE_UNAVAILABLE');
      expect(result.stderr).toContain('--build <id>');
    });
  });

  describe('output', () => {
    it(`should print one fact per line without --json`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--platform', 'ios'], {
        STUB_FP_HASH: CHANGED_HASH,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('needs-native-build — the app has to be built again');
      expect(result.stdout).toContain('ota');
      expect(result.stdout).toContain('What this cannot establish exactly:');
    });

    it(`should print exactly one JSON object on stdout with --json`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, ['--platform', 'ios', '--json']);

      expect(() => JSON.parse(result.stdout)).not.toThrow();
      expect(result.stdout.trim().endsWith('}')).toBe(true);
    });

    it(`should skip the follow-up block with --no-followups`, async () => {
      const projectRoot = await setupAsync();

      const result = await runImpactAsync(projectRoot, [
        '--platform',
        'ios',
        '--no-followups',
        '--json',
      ]);

      expect(JSON.parse(result.stdout).followups).toEqual([]);
      expect(result.all).not.toContain('Suggested next:');
    });

    it(`should put the answer on the cli:impact event`, async () => {
      const projectRoot = await setupAsync();
      const eventLog = 'impact-events.jsonl';

      await runImpactAsync(projectRoot, ['--platform', 'ios', '--json'], {
        STUB_FP_HASH: CHANGED_HASH,
        LOG_EVENTS: eventLog,
      });

      const impact = readEvents(projectRoot, eventLog).find((entry) => entry._e === 'cli:impact');
      expect(impact).toMatchObject({
        mode: 'last-build',
        class: 'needs-native-build',
        otaSafe: false,
        runtimeVersionPolicy: 'appVersion',
        platforms: ['ios'],
        fingerprintChanged: true,
      });
    });
  });

  it(`should print the help without spawning anything`, async () => {
    const projectRoot = await setupAsync();

    const result = await executeExagentAsync(projectRoot, ['impact', '--help'], { reject: false });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('--assert');
    // The OTA split is the thing a reader most needs to be told, so the help says it.
    expect(result.stdout).toContain('OTA safety is reported separately');
    expect(readStubInvocations(projectRoot, STUB_FINGERPRINT_LOG_NAME)).toEqual([]);
  });
});
