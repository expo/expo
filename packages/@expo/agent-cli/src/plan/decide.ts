// @ref llp/0004-smart-start-and-project-state.rfc.md §Decision table
// The decision table of LLP 0004, as one pure function: probed state in, plan out. No I/O
// happens here, so every row is exhaustively unit-testable without a project or a device.

import { PROGRAM_NAME, PROGRAM_PREFIX } from '../programName';
import type { PlanStep, ProjectState, StartPlan } from '../project/types';
import { easBuildLocation, localBuildLocation } from '../toolchain/planLocation';
import {
  localRequirement,
  EAS_DEVELOPMENT_PROFILE,
  EAS_REQUIREMENT,
  EAS_WHERE,
  LOCAL_WHERE,
} from '../toolchain/runsOn';
import type { RunsOn } from '../toolchain/runsOn';
import type { BuildBackendChoice } from '../toolchain/selectBackend';
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
 *   Instead, freshness is decided against the fingerprint of the last build `@expo/agent-cli` itself
 *   ran, recorded in `.expo/agent-cli-last-build.json` (see `./lastBuild.ts`). An unrecorded
 *   project is therefore planned as stale, which over-plans a build at worst, never under-plans.
 *
 * @param state Facts gathered by the project-state probe.
 * @param options Target platform and the recorded build fingerprints, supplied by the caller.
 */
export function decideStartPlan(
  state: ProjectState,
  options: DecideStartPlanOptions = {}
): StartPlan {
  // @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app
  // The first row, above the web short-circuit, because it is not a fact about how the app runs —
  // it is the fact that there is no app. Without it the table read "no `expo` dependency" as "lacks
  // a dev client" and planned `expo install expo-dev-client` plus a native build for whatever
  // repository the caller happened to be standing in. Every command that would *act* on the plan
  // stops before reaching here; this row is what the commands that only *describe* the directory
  // print, so the engine and the guard never disagree.
  if (!state.isExpoApp) {
    return plan(
      'not-expo-app',
      'none',
      [],
      [
        `This directory is not an Expo app: its package.json declares no "expo" dependency.`,
        `There is nothing here to get onto a device, so the plan is empty. The app is most likely one directory down, or "${PROGRAM_PREFIX} new my-app" would create one here.`,
      ]
    );
  }

  // Web needs no native app at all, so it short-circuits every native row. The web target is
  // only chosen when it is asked for: an Expo project always *can* target native, so no probed
  // fact proves that web is the only option.
  if (options.platform === 'web') {
    return plan(
      'web',
      'web',
      [step('start', ['expo', 'start', '--web'], 'seconds', 'Serves the app to a web browser.')],
      [
        describeSdk(state),
        'Target platform: web.',
        state.hasWeb
          ? 'react-native-web is a dependency.'
          : 'react-native-web is not a dependency, so the web bundle may fail to build.',
      ]
    );
  }

  const platform = resolveNativePlatform(state, options);
  const build = describeFreshness(state, platform, options.lastBuild ?? {});
  // @ref llp/0015-backend-selection-and-config.rfc.md §The selection
  // Resolved by the caller and folded in here, so the *steps* of a build plan are the steps of the
  // backend that was chosen. This is the whole difference from the previous design, which decided
  // a local plan and then warned that it could not run: the decision is made before the plan is
  // printed, so the plan that gets approved is the plan that gets run.
  const backend = options.buildBackend ?? null;
  const runTarget = options.runTarget ?? null;

  // The reason list is written per rule, because the honest sentence about the platform depends on
  // what the plan then does with it: a plan that builds for iOS and a plan that serves a bundle and
  // opens nothing on iOS both "target ios", and only one of them acts on the phrase.
  const factsWhen = (actsOnPlatform: boolean) => [
    describeSdk(state),
    describeTargetPlatform(platform, options, actsOnPlatform),
    describeNativeDirs(state),
    describeDevClient(state),
    describeExpoGo(state),
  ];
  // A `expo start` step only reaches a device when the caller typed the flag that opens one.
  const facts = factsWhen(openTargetOf(options) != null);
  /** The extra sentences a plan that *builds* gains from the backend it was given. */
  const buildFacts = backendReasons(backend, platform, options.easJson);
  // Said on **every** native row, not only the one a preference moved. "Did my config do
  // anything?" is a question the plan has to answer either way, and a plan that mentions the
  // preference only when it changed something leaves the reader unable to tell the two apart.
  const targetFacts = runTargetReasons(runTarget, state);
  /** The steps that make and install the app, per the backend that was chosen. */
  const buildSteps = (reason: string, prebuild: boolean): PlanStep[] =>
    backend?.runsOn === 'eas'
      ? easRouteSteps(platform, reason, options)
      : [...(prebuild ? [prebuildStep(platform)] : []), runStep(platform, reason)];
  const location = () =>
    backend?.runsOn === 'eas'
      ? easBuildLocation(platform, backend)
      : localBuildLocation(platform, backend);

  // Checked-in native directories are the strongest signal: the project is bare, so the plan
  // never regenerates them with prebuild. `expo run:*` performs the pod install / gradle sync
  // that the LLP table calls for before building.
  if (state.nativeDirs.ios || state.nativeDirs.android) {
    return build.fresh
      ? plan(
          'bare-fresh',
          'bare',
          [startDevClientStep(build.summary, options)],
          [...facts, ...build.reasons, ...targetFacts]
        )
      : plan(
          'bare-stale',
          'bare',
          buildSteps(build.summary, false),
          [...factsWhen(true), ...build.reasons, ...targetFacts, ...buildFacts],
          location()
        );
  }

  // From here the project uses Continuous Native Generation: no native directories exist, so a
  // build always starts with prebuild.
  if (state.usesDevClient) {
    return build.fresh
      ? plan(
          'dev-client-fresh',
          'dev-client',
          [startDevClientStep(build.summary, options)],
          [...facts, ...build.reasons, ...targetFacts]
        )
      : plan(
          'dev-client-stale',
          'dev-client',
          buildSteps(build.summary, true),
          [...factsWhen(true), ...build.reasons, ...targetFacts, ...buildFacts],
          location()
        );
  }

  // @ref llp/0015-backend-selection-and-config.rfc.md §The run target
  // The one row a run-target preference can move. Everything below it already ends in a
  // development build, and nothing a config says can make an incompatible project run in Expo Go —
  // so `dev-build` is the only value that changes a plan here, and it changes exactly this one.
  if (state.expoGo.compatible && runTarget?.target !== 'dev-build') {
    return plan('expo-go', 'expo-go', [startExpoGoStep(options)], [...facts, ...targetFacts]);
  }

  // Not compatible with Expo Go — or compatible and passed over, because a development build was
  // asked for. Either way the project needs the whole dev-client path, and the recorded
  // fingerprint is irrelevant: no build of this project can exist before `expo-dev-client` is.
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
      ...buildSteps('The first development build of this project has to be made.', true),
    ],
    [...factsWhen(true), ...targetFacts, ...buildFacts],
    location()
  );
}

function plan(
  rule: StartPlanRule,
  target: StartPlan['target'],
  steps: PlanStep[],
  reasons: string[],
  buildLocation: StartPlan['buildLocation'] = null
): StartPlan {
  return { target, rule, steps, reasons, buildLocation };
}

/**
 * One step.
 *
 * `runsOn` defaults to `null` — the answer for every step that builds nothing, which is most of
 * them. Only the two steps that put a compiler to work say `local`.
 */
function step(
  id: string,
  argv: string[],
  timeClass: PlanStep['timeClass'],
  reason: string,
  runsOn: RunsOn | null = null
): PlanStep {
  return { id, argv, timeClass, reason, runsOn };
}

/**
 * The Expo Go step, with the platform flag the caller typed on it.
 *
 * The `reason` used to read "Opens the project in Expo Go", which `expo start --go` does not do:
 * it serves a bundle and waits. Nothing opened the app, `--ios` changed nothing in the printed
 * plan even though it is forwarded to `expo start`, and following the plan left an agent with a
 * dev server and no way to reach it. Both halves are fixed here: the flag is in the argv, and the
 * sentence says what each form actually does.
 */
function startExpoGoStep(options: DecideStartPlanOptions): PlanStep {
  const opensOn = openTargetOf(options);
  return step(
    'start',
    ['expo', 'start', '--go', ...(opensOn ? [`--${opensOn}`] : [])],
    'seconds',
    opensOn
      ? `Serves the project to Expo Go and opens it on ${deviceNoun(opensOn)}, booting one and installing Expo Go if it has to. No native build is needed.`
      : `Serves the project to Expo Go, which needs no native build. It opens nothing on its own — run "${PROGRAM_NAME} navigate /" once it is up, or pass --ios or --android.`
  );
}

function startDevClientStep(reason: string, options: DecideStartPlanOptions = {}): PlanStep {
  const opensOn = openTargetOf(options);
  return step(
    'start',
    ['expo', 'start', '--dev-client', ...(opensOn ? [`--${opensOn}`] : [])],
    'seconds',
    opensOn
      ? `Starts the dev server and opens the development build on ${deviceNoun(opensOn)}. ${reason}`
      : `Starts the dev server for the existing development build. It opens nothing on its own — run "${PROGRAM_NAME} navigate /" once it is up, or pass --ios or --android. ${reason}`
  );
}

/**
 * The device `expo start` will open the app on, or null when nothing will be opened.
 *
 * Only a flag the caller typed counts. `web` is left out: the plan's own `--web` row already
 * describes serving a browser, and a native plan is not the place to open one.
 */
function openTargetOf({ requestedPlatform }: DecideStartPlanOptions): NativePlatform | null {
  return requestedPlatform === 'ios' || requestedPlatform === 'android' ? requestedPlatform : null;
}

function deviceNoun(platform: NativePlatform): string {
  return platform === 'ios' ? 'a booted iOS simulator' : 'an attached Android device or emulator';
}

/**
 * Prebuild, which runs locally and is labelled so.
 *
 * It generates source rather than a binary, and it is still a `local` step: on iOS it ends in a
 * `pod install` that wants Xcode's command line tools, and it is the first half of a build that
 * only ever happens on this machine. A caller who cannot build here needs to know that at this
 * step, not at the next one.
 */
function prebuildStep(platform: NativePlatform): PlanStep {
  return step(
    'prebuild',
    ['expo', 'prebuild', '--platform', platform],
    'a-minute',
    `Generates the ${platform} native project from the app config and the installed packages. Runs ${LOCAL_WHERE}, as the first half of a local build.`,
    'local'
  );
}

function runStep(platform: NativePlatform, reason: string): PlanStep {
  return step(
    'run',
    ['expo', `run:${platform}`],
    'many-minutes',
    `Builds the ${platform} app ${LOCAL_WHERE} (a local build, which needs ${localRequirement(platform)}), installs it, and starts the dev server. ${reason}`,
    'local'
  );
}

/**
 * The steps that replace `prebuild` + `run:*` when the build runs on EAS.
 *
 * Three differences from the local route, all of them worth the reader's attention:
 *
 * - **No prebuild.** EAS Build generates the native project itself for a CNG app, so a prebuild
 *   here would only be work done twice — and it is the step that needs a toolchain this route was
 *   chosen to avoid.
 * - **The dev server is its own step.** `expo run:*` builds, installs and starts; `eas build`
 *   builds and stops, so `expo start --dev-client` has to follow it.
 * - **Installing the artifact is guidance, not a step** [decided — llp/0015 §The plan approved is the plan run]. Whether the finished build can be installed *here* depends on there being a
 *   simulator or a device attached to this machine, which is exactly what the host that sent this
 *   build to the cloud may not have. A step that cannot be run on the host it was planned for is
 *   worse than a sentence saying what to run when there is somewhere to run it.
 */
function easRouteSteps(
  platform: NativePlatform,
  reason: string,
  options: DecideStartPlanOptions
): PlanStep[] {
  const configure: PlanStep[] =
    options.easJson === false
      ? [
          step(
            'eas-configure',
            ['eas', 'build:configure'],
            'a-minute',
            `Creates eas.json, which the build below reads to know what the "${EAS_DEVELOPMENT_PROFILE}" profile is. This project has none yet.`
          ),
        ]
      : [];

  return [
    ...configure,
    step(
      'eas-build',
      ['eas', 'build', '--platform', platform, '--profile', EAS_DEVELOPMENT_PROFILE],
      'many-minutes',
      `Builds the ${platform} development build ${EAS_WHERE} (a cloud build, which needs ${EAS_REQUIREMENT} rather than ${localRequirement(platform)}) and ends with a downloadable artifact. Install it on a device before the dev server can reach it — "npx eas build:run --platform ${platform} --latest" does that on a booted simulator or an attached device. ${reason}`,
      'eas'
    ),
    step(
      'start',
      ['expo', 'start', '--dev-client'],
      'seconds',
      `Starts the dev server for the build above. Unlike a local build, "eas build" does not start one — and it serves nothing until the artifact is installed.`
    ),
  ];
}

/**
 * The sentences a building plan gains from the backend that was chosen.
 *
 * The selection's own `why` first, because it is the sentence that says *what decided this* and
 * every other surface prints the same one. What follows is only what this plan's shape adds.
 */
function backendReasons(
  backend: BuildBackendChoice | null,
  platform: NativePlatform,
  easJson: boolean | undefined
): string[] {
  if (!backend) {
    return [];
  }
  const reasons = [backend.why];

  if (backend.doomed) {
    reasons.push(
      `That was asked for explicitly, so the plan above is the plan that runs — and its build step will fail, because nothing on this host can perform it. Remove the choice, or pass --eas, to build for ${platform} ${EAS_WHERE} instead.`
    );
  }

  if (backend.runsOn === 'eas') {
    reasons.push(
      `The cloud build generates the native project itself, so this plan has no prebuild step.`
    );
    if (easJson === false) {
      reasons.push(
        `This project has no eas.json, so the plan configures one first; that step may ask which platforms to set up.`
      );
    }
  }

  return reasons;
}

/** What a run-target preference did to this plan, or nothing when nobody expressed one. */
function runTargetReasons(
  runTarget: { target: string; why: string } | null,
  state: ProjectState
): string[] {
  if (!runTarget) {
    return [];
  }
  if (runTarget.target === 'dev-build') {
    return [
      state.expoGo.compatible
        ? `${runTarget.why} Expo Go could run this project, and the plan builds one anyway.`
        : `${runTarget.why} Expo Go could not have run this project in any case.`,
    ];
  }
  // `expo-go` asked for, which this CLI can honour and cannot enforce.
  return [
    state.expoGo.compatible
      ? `${runTarget.why} Expo Go can run this project, so that is what the plan uses.`
      : `${runTarget.why} Expo Go cannot run this project, so the plan is a development build regardless — the reasons are above.`,
  ];
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

/**
 * What the plan's platform is, and where it came from.
 *
 * `Target platform: ios.` was true of the *decision* and misleading about the plan: with no flag on
 * the command line the platform is an inference from the host, and for an `expo start` plan nothing
 * in the argv acts on it — an agent read "the target is iOS" next to `["expo","start","--go"]`,
 * which opens nothing on iOS [observed — friction run 2, 2026-08-23]. Both facts are said out loud
 * now: whether anyone named the platform, and whether the plan does anything with it.
 *
 * @param actsOnPlatform Whether a step of this plan builds for, or opens the app on, the platform.
 */
function describeTargetPlatform(
  platform: NativePlatform,
  { requestedPlatform }: DecideStartPlanOptions,
  actsOnPlatform: boolean
): string {
  if (requestedPlatform === platform) {
    return `Target platform: ${platform}, named on the command line.`;
  }
  return actsOnPlatform
    ? `No platform was named; this host suggests ${platform}, and the plan builds for it.`
    : `No platform was named; this host suggests ${platform}, and the plan opens nothing on it — pass --ios or --android, or run "${PROGRAM_NAME} navigate /" once the dev server is up.`;
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
 * Compare the project fingerprint against the last build `@expo/agent-cli` recorded for the platform.
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
