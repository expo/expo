import type { ProjectState } from '../../project/types';
import { decideStartPlan } from '../decide';

function createState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    projectRoot: '/project',
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: false,
    hasWeb: true,
    expoGo: { compatible: true, reasons: [] },
    fingerprint: { hash: 'abc123def4567890' },
    ...overrides,
  };
}

/** The state of a managed project that needs a development build. */
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

function argvOf(steps: { argv: string[] }[]): string[][] {
  return steps.map((step) => step.argv);
}

describe(decideStartPlan, () => {
  describe('rule: web', () => {
    it(`should start the dev server for web when the web platform is requested`, () => {
      const plan = decideStartPlan(createState(), { platform: 'web' });

      expect(plan.rule).toBe('web');
      expect(plan.target).toBe('web');
      expect(argvOf(plan.steps)).toEqual([['expo', 'start', '--web']]);
      expect(plan.steps[0]!.timeClass).toBe('seconds');
    });

    it(`should choose web over every native rule`, () => {
      const plan = decideStartPlan(
        createDevClientState({ nativeDirs: { ios: true, android: true } }),
        { platform: 'web' }
      );

      expect(plan.rule).toBe('web');
    });

    it(`should warn when the project has no react-native-web dependency`, () => {
      const plan = decideStartPlan(createState({ hasWeb: false }), { platform: 'web' });

      expect(plan.rule).toBe('web');
      expect(plan.reasons.join('\n')).toMatch(/react-native-web is not a dependency/);
    });
  });

  describe('rule: expo-go', () => {
    it(`should only start the dev server for an Expo Go compatible project`, () => {
      const plan = decideStartPlan(createState(), { platform: 'ios' });

      expect(plan.rule).toBe('expo-go');
      expect(plan.target).toBe('expo-go');
      expect(argvOf(plan.steps)).toEqual([['expo', 'start', '--go']]);
      expect(plan.steps[0]!.timeClass).toBe('seconds');
      expect(plan.reasons.join('\n')).toMatch(/Expo Go can run this project/);
    });

    it(`should not choose Expo Go when the project depends on expo-dev-client`, () => {
      const plan = decideStartPlan(createState({ usesDevClient: true }), { platform: 'ios' });

      expect(plan.rule).not.toBe('expo-go');
    });

    it(`should not choose Expo Go when native directories are checked in`, () => {
      const plan = decideStartPlan(createState({ nativeDirs: { ios: true, android: false } }), {
        platform: 'ios',
      });

      expect(plan.rule).not.toBe('expo-go');
    });

    // The plan used to say "Opens the project in Expo Go", which `expo start --go` does not do:
    // it serves a bundle and waits. Following the plan left an agent with a dev server and no way
    // to reach the app, and `--ios` changed nothing in the argv even though it is forwarded.
    it(`should not claim to open anything when no platform flag was typed`, () => {
      const reason = decideStartPlan(createState(), { platform: 'ios' }).steps[0]!.reason;

      expect(reason).not.toMatch(/^Opens/);
      expect(reason).toContain('opens nothing on its own');
      expect(reason).toContain('exagent navigate /');
    });

    it.each([
      ['ios', 'a booted iOS simulator'],
      ['android', 'an attached Android device or emulator'],
    ] as const)(`should plan and describe the open that --%s performs`, (platform, device) => {
      const plan = decideStartPlan(createState(), {
        platform,
        requestedPlatform: platform,
      });

      // The flag really is forwarded to `expo start`, so the printed argv has to show it.
      expect(argvOf(plan.steps)).toEqual([['expo', 'start', '--go', `--${platform}`]]);
      expect(plan.steps[0]!.reason).toContain(`opens it on ${device}`);
      expect(plan.steps[0]!.reason).not.toContain('opens nothing');
    });

    // The platform to *build* for is always resolved; only a typed flag reaches `expo start`.
    it(`should not invent a flag from the platform it fell back to`, () => {
      const plan = decideStartPlan(createState(), { platform: 'ios' });

      expect(argvOf(plan.steps)).toEqual([['expo', 'start', '--go']]);
    });

    // `--web` serves a browser; the native rows have no business opening one.
    it(`should not put --web on a native start step`, () => {
      const plan = decideStartPlan(createState(), { platform: 'ios', requestedPlatform: 'web' });

      expect(argvOf(plan.steps)).toEqual([['expo', 'start', '--go']]);
    });
  });

  describe('rule: dev-client-fresh', () => {
    it(`should only start the dev server when the fingerprint matches the last build`, () => {
      const state = createDevClientState();
      const plan = decideStartPlan(state, {
        platform: 'ios',
        lastBuild: { ios: state.fingerprint.hash! },
      });

      expect(plan.rule).toBe('dev-client-fresh');
      expect(plan.target).toBe('dev-client');
      expect(argvOf(plan.steps)).toEqual([['expo', 'start', '--dev-client']]);
      expect(plan.steps[0]!.timeClass).toBe('seconds');
      // A dev server opens nothing, whichever runtime it serves.
      expect(plan.steps[0]!.reason).toContain('opens nothing on its own');
    });

    it(`should plan the open a development build gets from --ios`, () => {
      const state = createDevClientState();
      const plan = decideStartPlan(state, {
        platform: 'ios',
        requestedPlatform: 'ios',
        lastBuild: { ios: state.fingerprint.hash! },
      });

      expect(argvOf(plan.steps)).toEqual([['expo', 'start', '--dev-client', '--ios']]);
      expect(plan.steps[0]!.reason).toContain(
        'opens the development build on a booted iOS simulator'
      );
    });

    it(`should ignore a matching hash recorded for another platform`, () => {
      const state = createDevClientState();
      const plan = decideStartPlan(state, {
        platform: 'android',
        lastBuild: { ios: state.fingerprint.hash! },
      });

      expect(plan.rule).toBe('dev-client-stale');
    });

    it(`should start Expo Go compatible projects in the dev client when one is a dependency`, () => {
      const state = createState({ usesDevClient: true });
      const plan = decideStartPlan(state, {
        platform: 'ios',
        lastBuild: { ios: state.fingerprint.hash! },
      });

      expect(plan.rule).toBe('dev-client-fresh');
    });
  });

  describe('rule: dev-client-stale', () => {
    it(`should prebuild and build when no build was recorded`, () => {
      const plan = decideStartPlan(createDevClientState(), { platform: 'ios' });

      expect(plan.rule).toBe('dev-client-stale');
      expect(plan.target).toBe('dev-client');
      expect(argvOf(plan.steps)).toEqual([
        ['expo', 'prebuild', '--platform', 'ios'],
        ['expo', 'run:ios'],
      ]);
      expect(plan.steps.map((step) => step.timeClass)).toEqual(['a-minute', 'many-minutes']);
      expect(plan.reasons.join('\n')).toMatch(/No development build recorded for ios/);
    });

    it(`should prebuild and build when the fingerprint changed`, () => {
      const plan = decideStartPlan(createDevClientState(), {
        platform: 'android',
        lastBuild: { android: 'a-different-hash' },
      });

      expect(plan.rule).toBe('dev-client-stale');
      expect(argvOf(plan.steps)).toEqual([
        ['expo', 'prebuild', '--platform', 'android'],
        ['expo', 'run:android'],
      ]);
      expect(plan.reasons.join('\n')).toMatch(/differs from the last recorded build/);
    });

    it(`should build when the fingerprint could not be computed`, () => {
      const state = createDevClientState({
        fingerprint: { hash: null, error: 'fingerprint exited with code 1' },
      });
      const plan = decideStartPlan(state, { platform: 'ios', lastBuild: { ios: 'any-hash' } });

      expect(plan.rule).toBe('dev-client-stale');
      expect(plan.reasons).toContain('Fingerprint error: fingerprint exited with code 1');
      // The error can be long, so it stays out of the step reason.
      expect(plan.steps[1]!.reason).not.toMatch(/exited with code 1/);
      expect(plan.steps[1]!.reason).toMatch(/fingerprint is unavailable/i);
    });

    it(`should build when the fingerprint is missing without an error`, () => {
      const state = createDevClientState({ fingerprint: { hash: null } });
      const plan = decideStartPlan(state, { platform: 'ios', lastBuild: { ios: 'any-hash' } });

      expect(plan.rule).toBe('dev-client-stale');
      expect(plan.reasons.join('\n')).toMatch(/fingerprint is unavailable/i);
    });
  });

  describe('rule: bare-stale', () => {
    it(`should build without prebuilding when native directories are checked in`, () => {
      const plan = decideStartPlan(
        createDevClientState({ nativeDirs: { ios: true, android: false } }),
        { platform: 'ios' }
      );

      expect(plan.rule).toBe('bare-stale');
      expect(plan.target).toBe('bare');
      expect(argvOf(plan.steps)).toEqual([['expo', 'run:ios']]);
      expect(plan.steps[0]!.timeClass).toBe('many-minutes');
    });

    it(`should build a bare project that has no expo-dev-client dependency`, () => {
      const plan = decideStartPlan(createState({ nativeDirs: { ios: false, android: true } }), {
        platform: 'android',
      });

      expect(plan.rule).toBe('bare-stale');
      expect(argvOf(plan.steps)).toEqual([['expo', 'run:android']]);
    });

    it(`should build the requested platform when both native directories exist`, () => {
      const plan = decideStartPlan(
        createDevClientState({ nativeDirs: { ios: true, android: true } }),
        { platform: 'android' }
      );

      expect(plan.rule).toBe('bare-stale');
      expect(argvOf(plan.steps)).toEqual([['expo', 'run:android']]);
    });

    it(`should default to iOS when both native directories exist and no platform is requested`, () => {
      const plan = decideStartPlan(
        createDevClientState({ nativeDirs: { ios: true, android: true } })
      );

      expect(argvOf(plan.steps)).toEqual([['expo', 'run:ios']]);
    });

    it(`should infer the platform from the only native directory`, () => {
      const plan = decideStartPlan(
        createDevClientState({ nativeDirs: { ios: false, android: true } })
      );

      expect(argvOf(plan.steps)).toEqual([['expo', 'run:android']]);
    });
  });

  describe('rule: bare-fresh', () => {
    it(`should only start the dev server when the fingerprint matches the last build`, () => {
      const state = createDevClientState({ nativeDirs: { ios: true, android: false } });
      const plan = decideStartPlan(state, {
        platform: 'ios',
        lastBuild: { ios: state.fingerprint.hash! },
      });

      expect(plan.rule).toBe('bare-fresh');
      expect(plan.target).toBe('bare');
      expect(argvOf(plan.steps)).toEqual([['expo', 'start', '--dev-client']]);
    });
  });

  describe('rule: needs-dev-client', () => {
    it(`should install expo-dev-client, prebuild, and build`, () => {
      const state = createDevClientState({ usesDevClient: false });
      const plan = decideStartPlan(state, { platform: 'ios' });

      expect(plan.rule).toBe('needs-dev-client');
      expect(plan.target).toBe('dev-client');
      expect(argvOf(plan.steps)).toEqual([
        ['expo', 'install', 'expo-dev-client'],
        ['expo', 'prebuild', '--platform', 'ios'],
        ['expo', 'run:ios'],
      ]);
      expect(plan.steps.map((step) => step.timeClass)).toEqual([
        'a-minute',
        'a-minute',
        'many-minutes',
      ]);
      expect(plan.reasons.join('\n')).toMatch(/react-native-mmkv is not bundled in Expo Go/);
    });

    it(`should install expo-dev-client even when the fingerprint matches a recorded build`, () => {
      const state = createDevClientState({ usesDevClient: false });
      const plan = decideStartPlan(state, {
        platform: 'ios',
        lastBuild: { ios: state.fingerprint.hash! },
      });

      expect(plan.rule).toBe('needs-dev-client');
    });

    it(`should report an unknown SDK version as the reason it cannot use Expo Go`, () => {
      const state = createState({
        sdkVersion: null,
        expoGo: {
          compatible: false,
          reasons: [{ kind: 'unknown-sdk', detail: 'Could not resolve the expo package version' }],
        },
      });
      const plan = decideStartPlan(state, { platform: 'ios' });

      expect(plan.rule).toBe('needs-dev-client');
      expect(plan.reasons.join('\n')).toMatch(/Expo SDK version is unknown/);
      expect(plan.reasons.join('\n')).toMatch(/Could not resolve the expo package version/);
    });
  });

  describe('plan shape', () => {
    const cases: [string, ProjectState, Parameters<typeof decideStartPlan>[1]][] = [
      ['web', createState(), { platform: 'web' }],
      ['expo-go', createState(), {}],
      [
        'dev-client-fresh',
        createDevClientState(),
        { platform: 'ios', lastBuild: { ios: 'abc123def4567890' } },
      ],
      ['dev-client-stale', createDevClientState(), { platform: 'ios' }],
      ['bare-stale', createDevClientState({ nativeDirs: { ios: true, android: false } }), {}],
      [
        'bare-fresh',
        createDevClientState({ nativeDirs: { ios: true, android: false } }),
        { lastBuild: { ios: 'abc123def4567890' } },
      ],
      ['needs-dev-client', createDevClientState({ usesDevClient: false }), { platform: 'ios' }],
    ];

    it.each(cases)(`should describe every step of the %s plan`, (rule, state, options) => {
      const plan = decideStartPlan(state, options);

      expect(plan.rule).toBe(rule);
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.reasons.length).toBeGreaterThan(0);
      expect(new Set(plan.steps.map((step) => step.id)).size).toBe(plan.steps.length);
      for (const step of plan.steps) {
        expect(step.argv[0]).toBe('expo');
        expect(step.reason).not.toBe('');
        expect(step.timeClass).toBeTruthy();
      }
    });

    it(`should report the probed facts as reasons`, () => {
      const plan = decideStartPlan(createDevClientState(), { platform: 'ios' });

      expect(plan.reasons).toEqual([
        'Expo SDK 54.0.0.',
        'Target platform: ios.',
        'No bare native directories, so the native project comes from prebuild (CNG).',
        'expo-dev-client is a dependency.',
        'Expo Go cannot run this project: react-native-mmkv is not bundled in Expo Go.',
        'No development build recorded for ios, so a build is needed.',
      ]);
    });
  });
});
