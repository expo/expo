/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md
//
// `exagent dev --plan` emits the plan the decision table produced and exits without executing
// it, so a driving agent can present it for approval (llp/0008-guardrails). These tests check the
// plan against the fixture matrix in `e2e/fixtures/README.md`, and check that nothing ran.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  installStubBinAsync,
  installStubFingerprintAsync,
  readStubExpoInvocations,
  setupFixtureAsync,
} from '../utils';

/** The shape `dev --plan --json` prints, per `src/project/types.ts`. */
type StartPlan = {
  target: 'expo-go' | 'dev-client' | 'bare' | 'web';
  steps: {
    id: string;
    argv: string[];
    reason: string;
    timeClass: 'seconds' | 'a-minute' | 'minutes' | 'many-minutes';
    runsOn: 'local' | 'eas' | null;
  }[];
  rule: string;
  reasons: string[];
  buildLocation: {
    runsOn: 'local' | 'eas';
    platform: 'ios' | 'android';
    requirement: string;
    status: 'present' | 'missing' | 'unknown' | null;
    detail: string | null;
    caveats: string[];
    alternativeCommand: string | null;
    selection: {
      runsOn: 'local' | 'eas';
      source: 'flag' | 'config' | 'host' | 'toolchain' | 'default';
      because: string;
      why: string;
      doomed: boolean;
    } | null;
  } | null;
  followups: { id: string; command: string; why: string }[];
};

const TIME_CLASSES = ['seconds', 'a-minute', 'minutes', 'many-minutes'];

/**
 * Make this machine look like one without Xcode, whatever it really has.
 *
 * A stub `xcode-select` in the directory the e2e runner already puts on `PATH`: the probe shells
 * out to it exactly as it does to the real one, so this exercises the probe rather than a switch
 * built for the test. A host that is not macOS answers `missing` before it spawns anything, which
 * is the same answer by a different route — so the assertions hold on either.
 */
async function breakXcodeSelectAsync(projectRoot: string): Promise<void> {
  const binDir = path.join(projectRoot, '.stub-bin');
  const stubScript = path.join(binDir, 'xcode-select-stub.js');
  await fs.promises.mkdir(binDir, { recursive: true });
  await fs.promises.writeFile(
    stubScript,
    "process.stderr.write('xcode-select: error: unable to get active developer directory\\n');\nprocess.exit(2);\n"
  );
  await installStubBinAsync(binDir, 'xcode-select', stubScript);
}

/** Copy a fixture and install both stub bins the plan engine may reach for. */
async function setupAsync(fixtureName: string): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixtureName);
  await installStubFingerprintAsync(projectRoot);
  return projectRoot;
}

/**
 * Write the developer config into a copied fixture, at the key the CLI reads it from.
 *
 * @ref llp/0015-backend-selection-and-config.rfc.md §Where the config lives
 * `package.json` › `expo` › `exagent`, beside `expo.install` and `expo.doctor`. Written through
 * the real file, so this exercises the reader rather than a switch built for the test.
 */
async function writeExagentConfigAsync(projectRoot: string, config: unknown): Promise<void> {
  const file = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(await fs.promises.readFile(file, 'utf8'));
  packageJson.expo = { ...packageJson.expo, exagent: config };
  await fs.promises.writeFile(file, JSON.stringify(packageJson, null, 2));
}

/** Ask for the plan of a prepared project as text, and assert that asking executed nothing. */
async function planTextInAsync(
  projectRoot: string,
  args: string[] = [],
  env?: Record<string, string>
): Promise<string> {
  const result = await executeExagentAsync(projectRoot, ['dev', '--plan', ...args], { env });

  expect(result.exitCode).toBe(0);
  // `--plan` stops after emitting the plan, so the stub `expo` bin records no invocation.
  expect(readStubExpoInvocations(projectRoot)).toEqual([]);

  return result.stdout;
}

/** Ask for the plan of a fixture as text, and assert that asking executed nothing. */
async function planTextAsync(
  fixtureName: string,
  args: string[] = [],
  env?: Record<string, string>
): Promise<string> {
  return planTextInAsync(await setupAsync(fixtureName), args, env);
}

describe('exagent dev --plan', () => {
  // `dev` is a group now, so its own options are documented under the action the bare name runs.
  it('documents the flag in `dev:run --help`', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const result = await executeExagentAsync(projectRoot, ['dev:run', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('--plan');
  });

  describe('go-app — an Expo Go compatible CNG project', () => {
    it('plans to start the dev server for Expo Go', async () => {
      const output = await planTextAsync('go-app', ['--ios']);

      expect(output).toContain('expo-go');
      expect(output).toContain('target: expo-go');
      expect(output).toContain('expo start --go');
    });

    it('plans the same way without an explicit platform', async () => {
      const output = await planTextAsync('go-app');

      expect(output).toContain('expo start --go');
    });

    // The plan is what a driving agent reads before it acts. It used to print
    // `expo start --go` whatever platform flag was passed, and call it "Opens the project in
    // Expo Go" — a command that opens nothing, described as the thing that does.
    it('shows the platform flag it will really run with, and says what it does', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const result = await executeExagentAsync(projectRoot, ['dev', '--plan', '--json', '--ios']);

      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.steps.map((step) => step.argv)).toEqual([['expo', 'start', '--go', '--ios']]);
      expect(plan.steps[0]!.reason).toContain('opens it on a booted iOS simulator');
    });

    it('admits that a plain start opens nothing, and names what does', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const result = await executeExagentAsync(projectRoot, ['dev', '--plan', '--json']);

      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.steps.map((step) => step.argv)).toEqual([['expo', 'start', '--go']]);
      expect(plan.steps[0]!.reason).toContain('opens nothing on its own');
      expect(plan.steps[0]!.reason).toContain('exagent navigate /');
    });
  });

  describe('dev-client-app — a dev client project without a recorded build', () => {
    it('plans a prebuild and a native build for iOS', async () => {
      const output = await planTextAsync('dev-client-app', ['--ios']);

      expect(output).toContain('dev-client-stale');
      expect(output).toContain('target: dev-client');
      expect(output).toContain('expo prebuild --platform ios');
      expect(output).toContain('expo run:ios');
      // The unbundled module is why Expo Go is out, and the plan says so.
      expect(output).toContain('fake-native-module');
    });

    it('plans for Android when Android is requested', async () => {
      const output = await planTextAsync('dev-client-app', ['--android']);

      expect(output).toContain('expo prebuild --platform android');
      expect(output).toContain('expo run:android');
    });
  });

  describe('bare-app — committed native directories', () => {
    it('plans a native build without a prebuild', async () => {
      const output = await planTextAsync('bare-app', ['--ios']);

      expect(output).toContain('bare-stale');
      expect(output).toContain('target: bare');
      expect(output).toContain('expo run:ios');
      // Prebuild would overwrite the checked-in ios/ and android/ directories.
      expect(output).not.toContain('prebuild');
    });
  });

  describe('dev-client-fresh-app — a recorded build matching the fingerprint', () => {
    it('plans only the dev server, because the recorded build still matches', async () => {
      const output = await planTextAsync('dev-client-fresh-app', ['--ios']);

      expect(output).toContain('dev-client-fresh');
      expect(output).toContain('target: dev-client');
      expect(output).toContain('expo start --dev-client');
      // Nothing native has to rerun, so neither of the expensive steps is planned. The reasons
      // mention prebuild for any CNG project, so the check is on the commands, not the word.
      expect(output).not.toContain('expo prebuild');
      expect(output).not.toContain('expo run:ios');
    });

    it('plans a rebuild once the fingerprint no longer matches', async () => {
      // The stub fingerprint CLI prints whatever hash it is told to, which is how a changed
      // native surface is simulated without changing any real input.
      const output = await planTextAsync('dev-client-fresh-app', ['--ios'], {
        STUB_FINGERPRINT_HASH: 'a-hash-that-no-build-was-made-from',
      });

      expect(output).toContain('dev-client-stale');
      expect(output).toContain('expo prebuild --platform ios');
      expect(output).toContain('expo run:ios');
    });

    it('plans only the dev server for a bare project with a matching build', async () => {
      // `bare-fresh` needs a recorded build AND checked-in native directories. Rather than commit
      // a sixth near-identical fixture, the native directories are added to this copy.
      const projectRoot = await setupAsync('dev-client-fresh-app');
      await fs.promises.mkdir(path.join(projectRoot, 'ios'), { recursive: true });
      await fs.promises.mkdir(path.join(projectRoot, 'android'), { recursive: true });
      await fs.promises.writeFile(
        path.join(projectRoot, 'ios', 'Podfile'),
        "platform :ios, '15.1'\n"
      );
      await fs.promises.writeFile(path.join(projectRoot, 'android', 'build.gradle'), '// marker\n');

      const output = await planTextInAsync(projectRoot, ['--ios']);

      expect(output).toContain('bare-fresh');
      expect(output).toContain('target: bare');
      expect(output).toContain('expo start --dev-client');
      expect(output).not.toContain('expo prebuild');
    });
  });

  describe('go-app — the web platform', () => {
    it('plans the dev server for web when web is requested', async () => {
      const output = await planTextAsync('go-app', ['--web']);

      expect(output).toContain('rule: web');
      expect(output).toContain('target: web');
      expect(output).toContain('expo start --web');
      // The fixture depends on `react-native-web`, so the plan has no missing-dependency warning.
      expect(output).not.toContain('react-native-web is not a dependency');
    });
  });

  describe('the machine readable plan', () => {
    it('prints the StartPlan as JSON with `--plan --json`', async () => {
      const projectRoot = await setupFixtureAsync('dev-client-app');
      const result = await executeExagentAsync(projectRoot, ['dev', '--plan', '--json', '--ios']);

      expect(result.exitCode).toBe(0);

      // The plan is what a driving agent presents for approval, so it must parse as one object.
      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.rule).toBe('dev-client-stale');
      expect(plan.target).toBe('dev-client');
      expect(plan.steps.map((step) => step.argv)).toEqual([
        ['expo', 'prebuild', '--platform', 'ios'],
        ['expo', 'run:ios'],
      ]);
      expect(plan.reasons.length).toBeGreaterThan(0);

      // Step ids are unique, and every step names an Expo-family CLI (llp/0001 constraint 5).
      const ids = plan.steps.map((step) => step.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const step of plan.steps) {
        expect(step.argv[0]).toBe('expo');
        expect(step.reason).toBeTruthy();
        expect(TIME_CLASSES).toContain(step.timeClass);
      }

      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });
  });

  // @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
  describe('where the build runs', () => {
    // `--local` rather than nothing: without it this assertion depends on whether the machine
    // running the test has Xcode, and on one that does not the plan is now the cloud one — which
    // is the feature, and would read here as a flake.
    it('marks every building step local, and carries the requirement in the payload', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      const result = await executeExagentAsync(projectRoot, [
        'dev',
        '--plan',
        '--json',
        '--ios',
        '--local',
      ]);

      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.steps.map((step) => [step.id, step.runsOn])).toEqual([
        ['prebuild', 'local'],
        ['run', 'local'],
      ]);
      expect(plan.buildLocation).toMatchObject({
        runsOn: 'local',
        platform: 'ios',
        requirement: 'Xcode on this machine',
        alternativeCommand: 'npx eas build --platform ios --profile development',
      });
      // The status is this host's own answer and the fixtures cannot decide it, so what is pinned
      // is that a probe ran at all and answered with one of the three words it may answer with.
      expect(['present', 'missing', 'unknown']).toContain(plan.buildLocation!.status);
    });

    it('marks a plan that builds nothing as building nothing', async () => {
      const projectRoot = await setupAsync('go-app');
      const result = await executeExagentAsync(projectRoot, ['dev', '--plan', '--json', '--ios']);

      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.steps.map((step) => step.runsOn)).toEqual([null]);
      // Present and null, rather than absent: a caller reads one key instead of checking for it.
      expect(Object.keys(plan)).toContain('buildLocation');
      expect(plan.buildLocation).toBeNull();
    });

    // @ref llp/0015-backend-selection-and-config.rfc.md §The selection
    // The whole point of probing before the plan is printed, and the step past the version that
    // only warned: on a machine that cannot do the build, the plan *is* the cloud one.
    it('plans the EAS route when this machine has no Xcode', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      await breakXcodeSelectAsync(projectRoot);

      const output = await planTextInAsync(projectRoot, ['--ios']);

      expect(output).toContain('eas build --platform ios --profile development');
      expect(output).toContain('Build: eas');
      expect(output).toContain('an Expo account');
      // The steps are the cloud route, so the local one is not in them at all.
      expect(output).not.toContain('expo run:ios');
      // And the ladder leads with what a cloud build needs rather than with the route it took.
      expect(output).toMatch(/Suggested next:\s*\n\s*npx eas whoami/);
    });

    it('says which host fact chose the EAS route, before anything runs', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      await breakXcodeSelectAsync(projectRoot);

      const result = await executeExagentAsync(projectRoot, ['dev', '--plan', '--json', '--ios']);
      const plan: StartPlan = JSON.parse(result.stdout);

      expect(plan.buildLocation).toMatchObject({
        runsOn: 'eas',
        platform: 'ios',
        requirement: 'an Expo account',
        alternativeCommand: 'npx expo run:ios',
      });
      // `host` on a machine that is not macOS, `toolchain` on a Mac whose xcode-select is stubbed.
      // Both are the answer "this machine cannot"; which of the two depends on the runner.
      expect(['host', 'toolchain']).toContain(plan.buildLocation!.selection!.source);
      expect(plan.reasons).toContain(plan.buildLocation!.selection!.why);
      expect(plan.reasons).toContain(
        'The cloud build generates the native project itself, so this plan has no prebuild step.'
      );
    });

    it('takes the same route for a missing Android SDK, from the directory that is not there', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      const result = await executeExagentAsync(
        projectRoot,
        ['dev', '--plan', '--json', '--android'],
        { env: { ANDROID_HOME: path.join(projectRoot, 'no-such-android-sdk') } }
      );

      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.buildLocation).toMatchObject({
        runsOn: 'eas',
        platform: 'android',
        selection: { source: 'toolchain' },
      });
      expect(plan.buildLocation!.selection!.because).toContain('ANDROID_HOME');
      expect(plan.steps.map((step) => step.argv[0])).toContain('eas');
      expect(plan.followups[0]!.command).toBe('npx eas whoami');
    });

    // @ref llp/0015-backend-selection-and-config.rfc.md §The selection
    it('honours --local on a machine that cannot build, and says the plan will fail', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      await breakXcodeSelectAsync(projectRoot);

      const result = await executeExagentAsync(projectRoot, [
        'dev',
        '--plan',
        '--json',
        '--ios',
        '--local',
      ]);

      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.steps.map((step) => step.argv.join(' '))).toEqual([
        'expo prebuild --platform ios',
        'expo run:ios',
      ]);
      expect(plan.buildLocation).toMatchObject({
        runsOn: 'local',
        status: 'missing',
        selection: { source: 'flag' },
      });
      expect(plan.followups[0]!.command).toBe('npx eas build --platform ios --profile development');
    });

    it('honours --eas on a machine that could build here', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      const result = await executeExagentAsync(projectRoot, [
        'dev',
        '--plan',
        '--json',
        '--ios',
        '--eas',
      ]);

      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.buildLocation).toMatchObject({ runsOn: 'eas', selection: { source: 'flag' } });
      expect(plan.buildLocation!.selection!.why).toContain('--eas was passed on the command line');
    });

    it('refuses --eas and --local together, which name two places for one build', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      const result = await executeExagentAsync(
        projectRoot,
        ['dev', '--plan', '--ios', '--eas', '--local'],
        { reject: false }
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.all).toContain('two different places for one build');
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });

    it('says in the help which of the two routes each command is', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const dev = await executeExagentAsync(projectRoot, ['dev:run', '--help']);
      const wait = await executeExagentAsync(projectRoot, ['build:wait', '--help']);

      expect(dev.all).toContain('A local');
      expect(dev.all).toContain('A cloud build (eas build) happens');
      expect(wait.all).toContain('runs in the cloud');
      expect(wait.all).toContain('Expo account');
    });
  });

  // @ref llp/0015-backend-selection-and-config.rfc.md §Where the config lives
  describe('the developer config', () => {
    it('plans a development build for a project Expo Go could run', async () => {
      const projectRoot = await setupAsync('go-app');
      await writeExagentConfigAsync(projectRoot, { target: 'dev-build' });

      const result = await executeExagentAsync(projectRoot, [
        'dev',
        '--plan',
        '--json',
        '--ios',
        '--local',
      ]);

      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.rule).toBe('needs-dev-client');
      expect(plan.target).toBe('dev-client');
      expect(plan.steps.map((step) => step.argv.join(' '))).toEqual([
        'expo install expo-dev-client',
        'expo prebuild --platform ios',
        'expo run:ios',
      ]);
      // Labelled, so a reader can tell a plan the config changed from one it did not.
      expect(plan.reasons).toContain(
        'The exagent config asks for a development build. Expo Go could run this project, and the plan builds one anyway.'
      );
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });

    it('leaves the Expo Go plan alone when the config asks for Expo Go', async () => {
      const projectRoot = await setupAsync('go-app');
      await writeExagentConfigAsync(projectRoot, { target: 'expo-go' });

      const result = await executeExagentAsync(projectRoot, ['dev', '--plan', '--json', '--ios']);
      const plan: StartPlan = JSON.parse(result.stdout);

      expect(plan.rule).toBe('expo-go');
      expect(plan.reasons).toContain(
        'The exagent config asks for Expo Go. Expo Go can run this project, so that is what the plan uses.'
      );
    });

    it('sends the build to EAS on a machine that could do it here', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      await writeExagentConfigAsync(projectRoot, { buildBackend: 'eas' });

      const result = await executeExagentAsync(projectRoot, ['dev', '--plan', '--json', '--ios']);
      const plan: StartPlan = JSON.parse(result.stdout);

      expect(plan.buildLocation).toMatchObject({ runsOn: 'eas', selection: { source: 'config' } });
      expect(plan.buildLocation!.selection!.why).toContain('"expo.exagent" in package.json');
      expect(plan.steps.map((step) => step.argv[0])).toContain('eas');
    });

    it('applies a per-platform choice to that platform only', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      await writeExagentConfigAsync(projectRoot, { ios: { buildBackend: 'eas' } });

      const ios = await executeExagentAsync(projectRoot, ['dev', '--plan', '--json', '--ios']);
      const android = await executeExagentAsync(
        projectRoot,
        ['dev', '--plan', '--json', '--android', '--local'],
        { env: { ANDROID_HOME: path.join(projectRoot, 'no-such-android-sdk') } }
      );

      expect((JSON.parse(ios.stdout) as StartPlan).buildLocation!.runsOn).toBe('eas');
      expect((JSON.parse(android.stdout) as StartPlan).buildLocation!.runsOn).toBe('local');
    });

    it('lets a flag beat the config', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      await writeExagentConfigAsync(projectRoot, { buildBackend: 'eas' });

      const result = await executeExagentAsync(projectRoot, [
        'dev',
        '--plan',
        '--json',
        '--ios',
        '--local',
      ]);

      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.buildLocation).toMatchObject({ runsOn: 'local', selection: { source: 'flag' } });
    });

    it('refuses a key it does not know, naming the keys it does', async () => {
      const projectRoot = await setupAsync('go-app');
      await writeExagentConfigAsync(projectRoot, { backend: 'eas' });

      const result = await executeExagentAsync(projectRoot, ['dev', '--plan', '--ios'], {
        reject: false,
      });

      expect(result.exitCode).not.toBe(0);
      expect(result.all).toContain('does not know: "backend"');
      expect(result.all).toContain('"target", "buildBackend", "ios", "android"');
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });

    it('refuses a value outside the set, naming the set and the location', async () => {
      const projectRoot = await setupAsync('go-app');
      await writeExagentConfigAsync(projectRoot, { buildBackend: 'cloud' });

      const result = await executeExagentAsync(projectRoot, ['dev', '--plan', '--ios'], {
        reject: false,
      });

      expect(result.exitCode).not.toBe(0);
      expect(result.all).toContain('"expo.exagent" in package.json');
      expect(result.all).toContain('"local", "eas"');
    });

    it('changes nothing for a project that names no config', async () => {
      const withoutConfig = await setupAsync('go-app');
      const result = await executeExagentAsync(withoutConfig, ['dev', '--plan', '--json', '--ios']);

      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.rule).toBe('expo-go');
      expect(plan.reasons.join(' ')).not.toContain('exagent config');
    });
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — `dev --plan`.
  describe('follow-ups', () => {
    it('offers to run the plan it just printed', async () => {
      const output = await planTextAsync('go-app', ['--ios']);

      expect(output).toContain('Suggested next:');
      expect(output).toContain('npx exagent dev');
    });

    it('explains the build a stale plan includes', async () => {
      const output = await planTextAsync('dev-client-app', ['--ios']);

      expect(output).toContain('npx exagent status');
      // Expo Go is out for this fixture, so the reasons in the probe are worth reading in full.
      expect(output).toContain('npx exagent status --json');
      expect(output).not.toContain('npx exagent context');
    });

    it('embeds the follow-ups in the JSON plan, which stays one object', async () => {
      const projectRoot = await setupAsync('go-app');
      const result = await executeExagentAsync(projectRoot, ['dev', '--plan', '--json']);

      expect(result.exitCode).toBe(0);
      const plan: StartPlan = JSON.parse(result.stdout);
      expect(plan.followups.map((followup) => followup.id)).toEqual(['dev']);
    });

    it('leaves them out with --no-followups, keeping the key set', async () => {
      const projectRoot = await setupAsync('go-app');
      const text = await executeExagentAsync(projectRoot, ['dev', '--plan', '--no-followups']);
      const json = await executeExagentAsync(projectRoot, [
        'dev',
        '--plan',
        '--json',
        '--no-followups',
      ]);

      expect(text.stdout).not.toContain('Suggested next:');
      const plan: StartPlan = JSON.parse(json.stdout);
      expect(plan.followups).toEqual([]);
      expect(Object.keys(plan)).toContain('followups');
      // The flag is exagent's own, so it never reaches the Expo CLI.
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });

    it('leaves them out for EXAGENT_NO_FOLLOWUPS', async () => {
      const output = await planTextAsync('go-app', [], { EXAGENT_NO_FOLLOWUPS: '1' });

      expect(output).not.toContain('Suggested next:');
    });

    it('emits one cli:followups event for a driving agent', async () => {
      const projectRoot = await setupAsync('go-app');
      const eventsFile = path.join(projectRoot, 'events.jsonl');
      const result = await executeExagentAsync(projectRoot, ['dev', '--plan'], {
        env: { LOG_EVENTS: eventsFile },
      });

      expect(result.exitCode).toBe(0);
      const events = fs
        .readFileSync(eventsFile, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      // `2g` names the event in the `_e` field of every JSONL line.
      const followups = events.filter((entry) => entry._e === 'cli:followups');
      expect(followups).toHaveLength(1);
      expect(followups[0]).toMatchObject({ command: 'dev' });
      expect(followups[0].followups[0].id).toBe('dev');
    });
  });
});
