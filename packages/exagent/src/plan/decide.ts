// @ref llp/0004-smart-start-and-project-state.rfc.md §Decision table
// The decision table of LLP 0004, as one pure function: probed state in, plan out. No I/O
// happens here, so every row is exhaustively unit-testable without a project or a device.

import type { PlanStep, ProjectState, StartPlan } from '../project/types';
import type {
  DecideStartPlanOptions,
  LastBuildFingerprints,
  NativePlatform,
  StartPlanRule,
} from './types';

/** How many characters of a fingerprint hash are shown to humans and agents. */
const HASH_DISPLAY_LENGTH = 8;

/**
 * Decide what must run to get the project onto a device.
 *
 * The table below is the v1 implementation of the LLP 0004 decision table. Two rows of that
 * table need state this engine cannot observe yet, and are approximated:
 *
 * - "Go installed" / "dev client installed": v1 has no device or simulator probe, so install
 *   state is unknown. `expo start` prompts to install Expo Go, and `expo run:*` installs the
 *   development build it just made, so both paths still converge on a running app.
 * - "Build cache hit for current fingerprint": v1 does not query remote build-cache providers.
 *   Instead, freshness is decided against the fingerprint of the last build `exagent` itself
 *   ran, recorded in `.expo/exagent-last-build.json` (see `./lastBuild.ts`). An unrecorded
 *   project is therefore planned as stale, which over-plans a build at worst, never under-plans.
 *
 * @param state Facts gathered by the project-state probe.
 * @param options Target platform and the recorded build fingerprints, supplied by the caller.
 */
export function decideStartPlan(
  state: ProjectState,
  options: DecideStartPlanOptions = {}
): StartPlan {
  // Web needs no native app at all, so it short-circuits every native row. The web target is
  // only chosen when it is asked for: an Expo project always *can* target native, so no probed
  // fact proves that web is the only option.
  if (options.platform === 'web') {
    return {
      target: 'web',
      rule: 'web',
      steps: [
        step('start', ['expo', 'start', '--web'], 'seconds', 'Serves the app to a web browser.'),
      ],
      reasons: [
        describeSdk(state),
        'Target platform: web.',
        state.hasWeb
          ? 'react-native-web is a dependency.'
          : 'react-native-web is not a dependency, so the web bundle may fail to build.',
      ],
    };
  }

  const platform = resolveNativePlatform(state, options);
  const facts = [
    describeSdk(state),
    `Target platform: ${platform}.`,
    describeNativeDirs(state),
    describeDevClient(state),
    describeExpoGo(state),
  ];
  const build = describeFreshness(state, platform, options.lastBuild ?? {});

  // Checked-in native directories are the strongest signal: the project is bare, so the plan
  // never regenerates them with prebuild. `expo run:*` performs the pod install / gradle sync
  // that the LLP table calls for before building.
  if (state.nativeDirs.ios || state.nativeDirs.android) {
    return build.fresh
      ? plan(
          'bare-fresh',
          'bare',
          [startDevClientStep(build.summary)],
          [...facts, ...build.reasons]
        )
      : plan(
          'bare-stale',
          'bare',
          [runStep(platform, build.summary)],
          [...facts, ...build.reasons]
        );
  }

  // From here the project uses Continuous Native Generation: no native directories exist, so a
  // build always starts with prebuild.
  if (state.usesDevClient) {
    return build.fresh
      ? plan(
          'dev-client-fresh',
          'dev-client',
          [startDevClientStep(build.summary)],
          [...facts, ...build.reasons]
        )
      : plan(
          'dev-client-stale',
          'dev-client',
          [prebuildStep(platform), runStep(platform, build.summary)],
          [...facts, ...build.reasons]
        );
  }

  if (state.expoGo.compatible) {
    return plan(
      'expo-go',
      'expo-go',
      [
        step(
          'start',
          ['expo', 'start', '--go'],
          'seconds',
          'Opens the project in Expo Go, which needs no native build.'
        ),
      ],
      facts
    );
  }

  // Not compatible with Expo Go and no development build tooling yet: the project needs the
  // whole dev-client path. The recorded fingerprint is irrelevant, because no build of this
  // project can exist before `expo-dev-client` is installed.
  return plan(
    'needs-dev-client',
    'dev-client',
    [
      step(
        'install-dev-client',
        ['expo', 'install', 'expo-dev-client'],
        'a-minute',
        'Adds expo-dev-client, which the development build needs to load the dev server.'
      ),
      prebuildStep(platform),
      runStep(platform, 'The first development build of this project has to be made.'),
    ],
    facts
  );
}

function plan(
  rule: StartPlanRule,
  target: StartPlan['target'],
  steps: PlanStep[],
  reasons: string[]
): StartPlan {
  return { target, rule, steps, reasons };
}

function step(
  id: string,
  argv: string[],
  timeClass: PlanStep['timeClass'],
  reason: string
): PlanStep {
  return { id, argv, timeClass, reason };
}

function startDevClientStep(reason: string): PlanStep {
  return step(
    'start',
    ['expo', 'start', '--dev-client'],
    'seconds',
    `Starts the dev server for the existing development build. ${reason}`
  );
}

function prebuildStep(platform: NativePlatform): PlanStep {
  return step(
    'prebuild',
    ['expo', 'prebuild', '--platform', platform],
    'a-minute',
    `Generates the ${platform} native project from the app config and the installed packages.`
  );
}

function runStep(platform: NativePlatform, reason: string): PlanStep {
  return step(
    'run',
    ['expo', `run:${platform}`],
    'many-minutes',
    `Builds the ${platform} app, installs it, and starts the dev server. ${reason}`
  );
}

/**
 * Pick the platform to plan for.
 *
 * The caller passes the platform it read from the command line or from the host platform. When
 * it passes none, a single checked-in native directory decides; otherwise the plan targets iOS,
 * which is the default of `expo start` on macOS.
 */
function resolveNativePlatform(
  state: ProjectState,
  options: DecideStartPlanOptions
): NativePlatform {
  if (options.platform === 'ios' || options.platform === 'android') {
    return options.platform;
  }
  const { ios, android } = state.nativeDirs;
  if (android && !ios) {
    return 'android';
  }
  return 'ios';
}

function describeSdk(state: ProjectState): string {
  return state.sdkVersion ? `Expo SDK ${state.sdkVersion}.` : 'Expo SDK version is unknown.';
}

function describeNativeDirs(state: ProjectState): string {
  const dirs = (['ios', 'android'] as const).filter((platform) => state.nativeDirs[platform]);
  return dirs.length
    ? `Bare native directories are checked in: ${dirs.join(', ')}.`
    : 'No bare native directories, so the native project comes from prebuild (CNG).';
}

function describeDevClient(state: ProjectState): string {
  return state.usesDevClient
    ? 'expo-dev-client is a dependency.'
    : 'expo-dev-client is not a dependency.';
}

function describeExpoGo(state: ProjectState): string {
  if (state.expoGo.compatible) {
    return 'Expo Go can run this project.';
  }
  const details = state.expoGo.reasons.map((reason) => reason.detail).filter(Boolean);
  if (!details.length) {
    return 'Expo Go cannot run this project.';
  }
  // Probe details are sentences of their own, which may already end in a period.
  const joined = details.join('; ');
  return `Expo Go cannot run this project: ${joined.endsWith('.') ? joined : `${joined}.`}`;
}

interface Freshness {
  /** The installed app can be proven to match this project. */
  fresh: boolean;
  /** One short sentence, shown on the step it explains. */
  summary: string;
  /** The same sentence, plus any diagnostic detail, for the plan's reason list. */
  reasons: string[];
}

/**
 * Compare the project fingerprint against the last build `exagent` recorded for the platform.
 *
 * Anything short of a proven match is planned as a build. A missing fingerprint (the
 * `fingerprint` CLI is unavailable or failed) and a missing record both mean "cannot prove the
 * installed app matches this project".
 */
function describeFreshness(
  state: ProjectState,
  platform: NativePlatform,
  lastBuild: LastBuildFingerprints
): Freshness {
  const { hash, error } = state.fingerprint;
  if (hash == null) {
    // The error can be long, so it stays out of the step summary and lands in the reasons.
    const summary = 'The project fingerprint is unavailable, so a matching build cannot be proven.';
    return {
      fresh: false,
      summary,
      reasons: error ? [summary, `Fingerprint error: ${error}`] : [summary],
    };
  }

  const recorded = lastBuild[platform];
  if (recorded == null) {
    return freshness(false, `No development build recorded for ${platform}, so a build is needed.`);
  }
  if (recorded !== hash) {
    return freshness(
      false,
      `The project fingerprint (${shortHash(hash)}) differs from the last recorded build (${shortHash(recorded)}), so a new build is needed.`
    );
  }
  return freshness(
    true,
    `The project fingerprint (${shortHash(hash)}) matches the last build recorded for ${platform}.`
  );
}

function freshness(fresh: boolean, summary: string): Freshness {
  return { fresh, summary, reasons: [summary] };
}

function shortHash(hash: string): string {
  return hash.slice(0, HASH_DISPLAY_LENGTH);
}
