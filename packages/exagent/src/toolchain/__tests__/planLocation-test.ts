/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// The labelling table: for each row of the decision table, where its steps run, and what the plan
// says about a machine that cannot run them. `decideStartPlan` stays pure — the probe is the
// caller's, and `applyToolchainProbe` is the pure function that folds it in.
import { decideStartPlan } from '../../plan/decide';
import type { ProjectState, StartPlan } from '../../project/types';
import { applyToolchainProbe } from '../planLocation';
import type { ToolchainProbe } from '../types';

function createState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    projectRoot: '/project',
    isExpoApp: true,
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: false,
    hasWeb: true,
    expoGo: { compatible: true, reasons: [] },
    fingerprint: { hash: 'abc123def4567890' },
    ...overrides,
  };
}

/** A managed project that cannot run in Expo Go, so its plan contains a build. */
function createDevClientState(overrides: Partial<ProjectState> = {}): ProjectState {
  return createState({
    usesDevClient: true,
    expoGo: {
      compatible: false,
      reasons: [
        {
          kind: 'unbundled-native-module',
          packageName: 'react-native-mmkv',
          detail: 'react-native-mmkv is not bundled in Expo Go',
        },
      ],
    },
    ...overrides,
  });
}

function probe(overrides: Partial<ToolchainProbe> = {}): ToolchainProbe {
  return {
    platform: 'ios',
    status: 'present',
    detail: 'Xcode 16.2 at /Applications/Xcode.app/Contents/Developer.',
    requirement: 'Xcode on this machine',
    caveats: [],
    impossible: false,
    ...overrides,
  };
}

/** Every step's id with where it runs, which is the whole of the labelling contract. */
function runsOnOf(plan: StartPlan): [string, string | null][] {
  return plan.steps.map((step) => [step.id, step.runsOn]);
}

describe('where each row of the decision table runs', () => {
  it(`labels an Expo Go plan as building nothing`, () => {
    const plan = decideStartPlan(createState(), { platform: 'ios', requestedPlatform: 'ios' });

    expect(plan.rule).toBe('expo-go');
    // A dev server is not a build, and answering "where does it run" for it would make the key
    // unreadable on the steps where it means something.
    expect(runsOnOf(plan)).toEqual([['start', null]]);
    expect(plan.buildLocation).toBeNull();
  });

  it(`labels a web plan as building nothing`, () => {
    const plan = decideStartPlan(createState(), { platform: 'web' });

    expect(runsOnOf(plan)).toEqual([['start', null]]);
    expect(plan.buildLocation).toBeNull();
  });

  it(`labels a fresh dev-client plan as building nothing, because it builds nothing`, () => {
    const plan = decideStartPlan(createDevClientState(), {
      platform: 'ios',
      lastBuild: { ios: 'abc123def4567890' },
    });

    expect(plan.rule).toBe('dev-client-fresh');
    expect(runsOnOf(plan)).toEqual([['start', null]]);
    expect(plan.buildLocation).toBeNull();
  });

  it(`labels a stale dev-client plan's prebuild and build as local, and names the requirement`, () => {
    const plan = decideStartPlan(createDevClientState(), { platform: 'ios' });

    expect(plan.rule).toBe('dev-client-stale');
    expect(runsOnOf(plan)).toEqual([
      ['prebuild', 'local'],
      ['run', 'local'],
    ]);
    expect(plan.steps.at(-1)!.reason).toContain('on this machine');
    expect(plan.steps.at(-1)!.reason).toContain('Xcode on this machine');
    expect(plan.steps.at(-1)!.timeClass).toBe('many-minutes');
    expect(plan.buildLocation).toMatchObject({
      runsOn: 'local',
      platform: 'ios',
      requirement: 'Xcode on this machine',
      // Nothing probed the machine here, which is not the same as having probed and not known.
      status: null,
      alternativeCommand: 'npx eas build --platform ios --profile development',
    });
  });

  it(`labels a bare stale plan's build as local, with no prebuild to label`, () => {
    const plan = decideStartPlan(
      createDevClientState({ nativeDirs: { ios: false, android: true } }),
      { platform: 'android' }
    );

    expect(plan.rule).toBe('bare-stale');
    expect(runsOnOf(plan)).toEqual([['run', 'local']]);
    expect(plan.buildLocation).toMatchObject({
      platform: 'android',
      requirement: 'the Android SDK and a JDK on this machine',
      alternativeCommand: 'npx eas build --platform android --profile development',
    });
  });

  it(`labels the needs-dev-client plan, whose install step builds nothing`, () => {
    const plan = decideStartPlan(createState({ expoGo: { compatible: false, reasons: [] } }), {
      platform: 'ios',
    });

    expect(plan.rule).toBe('needs-dev-client');
    expect(runsOnOf(plan)).toEqual([
      ['install-dev-client', null],
      ['prebuild', 'local'],
      ['run', 'local'],
    ]);
  });
});

describe('applyToolchainProbe', () => {
  it(`says the machine can do it, and leaves the plan otherwise alone`, () => {
    const plan = decideStartPlan(createDevClientState(), { platform: 'ios' });
    const applied = applyToolchainProbe(plan, probe());

    expect(applied.buildLocation).toMatchObject({
      status: 'present',
      detail: 'Xcode 16.2 at /Applications/Xcode.app/Contents/Developer.',
    });
    expect(applied.steps).toEqual(plan.steps);
    expect(applied.reasons.join(' ')).toContain('Xcode 16.2');
    expect(applied.reasons.join(' ')).toContain('on this machine');
  });

  it(`names the EAS route up front when the local toolchain is missing`, () => {
    const plan = decideStartPlan(createDevClientState(), { platform: 'ios' });
    const applied = applyToolchainProbe(
      plan,
      probe({
        status: 'missing',
        detail: 'xcode-select is not on PATH, so no Xcode installation could be found (ENOENT).',
      })
    );

    expect(applied.buildLocation).toMatchObject({ status: 'missing' });
    const why = applied.reasons.join(' ');
    expect(why).toContain('xcode-select is not on PATH');
    expect(why).toContain('npx eas build --platform ios --profile development');
    expect(why).toContain('an Expo account');
    // The plan is not rewritten: the caller may have an answer this CLI cannot see, and a plan
    // that quietly swapped its own steps would no longer be the plan that was approved.
    expect(applied.steps).toEqual(plan.steps);
  });

  it(`does not call an unprobeable machine a machine without Xcode`, () => {
    const plan = decideStartPlan(createDevClientState(), { platform: 'ios' });
    const applied = applyToolchainProbe(
      plan,
      probe({ status: 'unknown', detail: 'The ios toolchain could not be probed: EPERM' })
    );

    const why = applied.reasons.join(' ');
    expect(applied.buildLocation).toMatchObject({ status: 'unknown' });
    expect(why).toContain('could not be established');
    expect(why).not.toContain('cannot run it');
    // The alternative is still named, because it is the answer if the machine turns out to lack it.
    expect(why).toContain('npx eas build --platform ios --profile development');
  });

  it(`carries the probe's caveats into the reasons, where a reader will meet them`, () => {
    const plan = decideStartPlan(createDevClientState(), { platform: 'android' });
    const applied = applyToolchainProbe(
      plan,
      probe({
        platform: 'android',
        requirement: 'the Android SDK and a JDK on this machine',
        detail: 'Android SDK at /home/dev/Library/Android/sdk (the default install location).',
        caveats: [
          'adb is not on PATH, though it is at /home/dev/Library/Android/sdk/platform-tools.',
        ],
      })
    );

    expect(applied.buildLocation!.caveats).toHaveLength(1);
    expect(applied.reasons.join(' ')).toContain('adb is not on PATH');
  });

  it(`is a no-op for a plan that builds nothing`, () => {
    const plan = decideStartPlan(createState(), { platform: 'ios' });

    expect(applyToolchainProbe(plan, probe())).toBe(plan);
  });
});

// @ref llp/0015-backend-selection-and-config.rfc.md §The selection
describe('folding the probe into a plan that already chose its backend', () => {
  /** A selection, as `selectBuildBackend` hands one to the table. */
  function chosen(source: 'flag' | 'config' | 'default') {
    const because = 'this is a test.';
    return {
      runsOn: 'local' as const,
      source,
      because,
      why: `Building on this machine: ${because}`,
      doomed: false,
    };
  }

  it(`does not repeat the sentence the selection already said`, () => {
    const plan = decideStartPlan(createDevClientState(), {
      platform: 'ios',
      buildBackend: chosen('default'),
    });
    const applied = applyToolchainProbe(plan, probe({ status: 'present' }));

    expect(applied.reasons).toContain('Building on this machine: this is a test.');
    expect(applied.reasons.filter((reason) => reason.includes('This machine has it'))).toEqual([]);
  });

  it(`does say it for a chosen local build the machine cannot perform`, () => {
    const plan = decideStartPlan(createDevClientState(), {
      platform: 'ios',
      buildBackend: chosen('flag'),
    });
    const applied = applyToolchainProbe(
      plan,
      probe({ status: 'missing', detail: 'xcode-select is not on PATH.' })
    );

    expect(applied.reasons).toContain(
      'The build in this plan runs on this machine (local) and needs Xcode. This machine cannot run it: xcode-select is not on PATH.'
    );
    expect(applied.reasons.some((reason) => reason.startsWith('Build for ios'))).toBe(true);
  });

  it(`carries the caveats whatever chose the backend`, () => {
    const plan = decideStartPlan(createDevClientState(), {
      platform: 'android',
      buildBackend: chosen('config'),
    });
    const applied = applyToolchainProbe(
      plan,
      probe({ platform: 'android', status: 'present', caveats: ['adb is not on PATH.'] })
    );

    expect(applied.reasons).toContain('adb is not on PATH.');
  });
});
