// @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol
// Every step of the Expo family that only a person can complete, as one table.
//
// Data, not string matching in the callers, in the same style as `src/commandRegistry.ts`: a
// scenario is added by writing a row, and both things a caller can do with it — raise the error by
// id, or recognise it in a captured failure — read the same row. That is what keeps the wording an
// agent sees identical whether the stop was predicted by a preflight or found in a tool's stderr.

/** A tool whose captured output the signatures of a scenario are matched against. */
import { PROGRAM_PREFIX } from '../programName';

export type NeedsHumanTool = 'expo' | 'eas' | 'create-launch';

export interface NeedsHumanScenario {
  /** Stable id, kebab-case. This is what the `cli:needs_human` event names. */
  id: string;
  /** The `CommandError` code raised for it. */
  code: string;
  /** One sentence naming what only a person can do. */
  need: string;
  /** The exact command a person runs in their own terminal. Null when only a URL applies. */
  command: string | null;
  /** The exact URL a person opens. Null when only a command applies. */
  url: string | null;
  /** Environment variables that remove the need on a machine with no person. */
  unattendedEnv: string[];
  /** Whether re-running the same `@expo/agent-cli` command works once the person is done. */
  resumable: boolean;
  /** Which tools' captured output {@link signatures} may be matched against. */
  tools: NeedsHumanTool[];
  /**
   * Stderr patterns that identify this scenario in a captured subprocess. Any one of them matches.
   *
   * Empty for a scenario that is never recognised from output: those are the ones a caller raises
   * by construction, because the command it was about to run has no non-interactive mode at all.
   */
  signatures: RegExp[];
  /**
   * The fallback of its tool: it names no command of its own, because the command a person has to
   * run is the one that just stopped. The classifier fills {@link NeedsHuman.command} in from the
   * failed invocation.
   */
  generic?: boolean;
}

/** Where a personal access token is made, for every scenario an `EXPO_TOKEN` answers. */
const ACCESS_TOKENS_URL = 'https://expo.dev/settings/access-tokens';

/**
 * The scenarios, most specific first.
 *
 * Order is load-bearing: `classifySubprocessFailure` answers with the first row whose signature
 * matches, so the two generic rows are last and only catch what nothing else recognised. A generic
 * answer that names the tool and quotes what it printed beats a confident wrong guess.
 */
export const needsHumanScenarios: NeedsHumanScenario[] = [
  {
    id: 'eas-login',
    code: 'EAS_LOGIN_REQUIRED',
    need: 'Sign in to an Expo account on this machine.',
    command: 'npx eas login',
    url: ACCESS_TOKENS_URL,
    unattendedEnv: ['EXPO_TOKEN'],
    resumable: true,
    tools: ['eas'],
    // The one stable auth error the EAS CLI prints when it cannot prompt
    // [observed — eas-cli 22.2.0, `build/user/SessionManager.js`].
    signatures: [/Either log in with[\s\S]{0,400}EXPO_TOKEN/],
  },
  {
    id: 'expo-login',
    code: 'EXPO_LOGIN_REQUIRED',
    need: 'Sign in to an Expo account on this machine.',
    command: 'npx expo login',
    url: ACCESS_TOKENS_URL,
    unattendedEnv: ['EXPO_TOKEN'],
    resumable: true,
    tools: ['expo', 'create-launch'],
    signatures: [/\bnot logged in\b/i, /needs? to be (?:logged in|authenticated)/i],
  },
  {
    id: 'macos-automation',
    code: 'MACOS_AUTOMATION_REQUIRED',
    need: 'Allow the terminal running this command to control Simulator.app, in macOS System Settings › Privacy & Security › Automation.',
    // No command *grants* the permission — a person flips a switch — so the command is the one
    // that puts the switch on screen, and `need` above says what to do once it is there.
    command: 'open "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation"',
    url: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Automation',
    // A permission is granted by a person clicking a switch; no variable stands in for it.
    unattendedEnv: [],
    resumable: true,
    tools: ['expo'],
    // `expo start --ios` drives Simulator.app through AppleScript, and macOS answers an app it has
    // no Automation grant for with `-1743` [observed live, 2026-08-23]. The Expo CLI does not catch
    // the rejection, so it ends the whole `expo start` process, dev server included.
    signatures: [
      /Not authorized to send Apple events/i,
      /\(-1743\)/,
      /osascript[\s\S]{0,300}exited with non-zero code/i,
    ],
  },
  {
    id: 'asc-api-key-create',
    code: 'ASC_API_KEY_REQUIRED',
    need: 'Create an App Store Connect API key in the Apple portal, or hand an existing one over.',
    command: 'npx eas credentials --platform ios',
    url: 'https://appstoreconnect.apple.com/access/integrations/api',
    unattendedEnv: [],
    resumable: true,
    tools: ['eas'],
    signatures: [/App Store Connect API Key cannot be created in non-interactive mode/i],
  },
  {
    id: 'apple-auth',
    code: 'APPLE_AUTH_REQUIRED',
    need: 'Sign in to Apple and approve the two-factor prompt on a trusted device.',
    command: 'npx eas credentials --platform ios',
    url: 'https://developer.apple.com/account',
    // The variable names are observed in the eas-cli build output. Two-factor approval stays a
    // person even with all four set [inferred].
    unattendedEnv: [
      'EXPO_APPLE_ID',
      'EXPO_APPLE_PASSWORD',
      'EXPO_APPLE_APP_SPECIFIC_PASSWORD',
      'EXPO_APPLE_TEAM_ID',
    ],
    resumable: true,
    tools: ['eas'],
    // No signature: the wording of an Apple sign-in failure is Apple's, not the EAS CLI's, and a
    // guess here would claim a two-factor prompt for any Apple error. Raised by construction.
    signatures: [],
  },
  {
    id: 'ios-credentials',
    code: 'IOS_CREDENTIALS_REQUIRED',
    need: 'Set up the iOS signing credentials for this project.',
    command: 'npx eas credentials --platform ios',
    url: null,
    unattendedEnv: [],
    resumable: true,
    tools: ['eas'],
    // `credentials` takes no `--non-interactive` [observed — eas-cli 22.2.0 manifest], so this is
    // raised before the command runs rather than recognised after it failed.
    signatures: [],
  },
  {
    id: 'android-keystore',
    code: 'ANDROID_KEYSTORE_REQUIRED',
    need: 'Set up the Android keystore for this project.',
    command: 'npx eas credentials --platform android',
    url: null,
    unattendedEnv: [],
    resumable: true,
    tools: ['eas'],
    signatures: [],
  },
  {
    id: 'device-register',
    code: 'DEVICE_REGISTRATION_REQUIRED',
    need: 'Register the iOS device: run the command, then scan the code on the phone.',
    command: 'npx eas device:create',
    url: null,
    unattendedEnv: [],
    resumable: true,
    tools: ['eas'],
    // `device:create` takes no `--non-interactive` [observed — eas-cli 22.2.0 manifest].
    signatures: [],
  },
  {
    id: 'launch-browser-handoff',
    code: 'LAUNCH_BROWSER_HANDOFF',
    need: 'Open the launch URL and finish the store steps in the browser.',
    command: null,
    url: 'https://launch.expo.dev',
    unattendedEnv: [],
    // A new run makes a new launch rather than resuming this one.
    resumable: false,
    tools: ['create-launch'],
    signatures: [],
  },
  {
    id: 'eas-env-list',
    code: 'EAS_ENV_LIST_INTERACTIVE',
    need: 'Run `eas env:list` yourself: it has no non-interactive mode.',
    command: 'npx eas env:list',
    url: null,
    unattendedEnv: [],
    // Nothing a person does makes the flag exist, so a re-run stops in the same place.
    resumable: false,
    tools: ['eas'],
    signatures: [],
  },
  {
    id: 'eas-profile-selection',
    code: 'EAS_PROFILE_REQUIRED',
    need: 'Name the build profile and the platform: the EAS CLI prompts for both.',
    command: 'npx eas config --platform ios --profile production',
    url: null,
    unattendedEnv: [],
    resumable: true,
    tools: ['eas'],
    signatures: [],
  },
  {
    id: 'agent-selection',
    code: 'NON_INTERACTIVE',
    need: 'Choose which coding agents to set up skills for.',
    command: `${PROGRAM_PREFIX} skills --agent claude-code`,
    url: null,
    unattendedEnv: [],
    resumable: true,
    // `@expo/agent-cli`'s own prompt, not a subprocess: there is no captured output to match.
    tools: [],
    signatures: [],
  },
  {
    id: 'expo-prompt',
    code: 'EXPO_NEEDS_INPUT',
    need: 'Answer what the Expo CLI asked for, in a terminal.',
    command: null,
    url: null,
    unattendedEnv: [],
    resumable: true,
    tools: ['expo'],
    // The prompt helper of `@expo/cli` fails fast with this exact sentence
    // [observed — `packages/@expo/cli/src/utils/prompts.ts`].
    //
    // **One question of the family is deliberately not this scenario:** "Use port 8181 instead?".
    // It matches these signatures like every other prompt does, and it is the only one a machine
    // can answer for itself, so `@expo/agent-cli dev` recognises it *before* the classifier runs and either
    // retries on a free port or reports the outcome (`src/dev/portCollision.ts`). The carve-out
    // lives there rather than as a negative signature here, because the recovery — pick a port, run
    // the step again — is the caller's to perform and cannot be expressed as a registry row.
    signatures: [/is in non-interactive mode/i, /Input is required, but/i],
    generic: true,
  },
  {
    id: 'eas-prompt',
    code: 'EAS_NEEDS_INPUT',
    need: 'Answer what the EAS CLI asked for, in a terminal.',
    command: null,
    url: null,
    unattendedEnv: [],
    resumable: true,
    tools: ['eas'],
    // The wording varies across the EAS CLI's many prompt sites; this fragment is the common part.
    signatures: [/in non-interactive mode/i],
    generic: true,
  },
];

/** One scenario by id, or null when nothing in the table has it. */
export function findNeedsHumanScenario(id: string): NeedsHumanScenario | null {
  return needsHumanScenarios.find((scenario) => scenario.id === id) ?? null;
}
