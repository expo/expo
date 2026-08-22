// @ref llp/0004-smart-start-and-project-state.rfc.md
// Shared contract for the project-state probe, the Expo Go compatibility check, the
// post-install impact classifier, and the smart start plan engine. Pure data — no I/O here.

/** How the app is expected to run during development. */
export type ProjectTarget = 'expo-go' | 'dev-client' | 'bare' | 'web';

/** One reason a project cannot run in Expo Go. */
export interface ExpoGoIncompatibility {
  kind: 'unbundled-native-module' | 'config-plugin' | 'custom-native-code' | 'unknown-sdk';
  /** The offending package or plugin, when one exists. */
  packageName?: string;
  /** Human/agent readable explanation. */
  detail: string;
}

export interface ExpoGoCompatibility {
  compatible: boolean;
  reasons: ExpoGoIncompatibility[];
}

/** Everything the decision table needs, gathered by the probe. All fields are observable
 * without a device: device/simulator install state is intentionally out of scope for v1. */
export interface ProjectState {
  projectRoot: string;
  /** From the installed `expo` package, e.g. "54.0.0". Null when unresolvable. */
  sdkVersion: string | null;
  /** Bare native project directories checked into the repo (vs CNG). */
  nativeDirs: { ios: boolean; android: boolean };
  /** `expo-dev-client` is a dependency. */
  usesDevClient: boolean;
  /** `react-native-web` is a dependency. */
  hasWeb: boolean;
  expoGo: ExpoGoCompatibility;
  /** `@expo/fingerprint` hash of the native surface, via subprocess. Null + error when the
   * fingerprint CLI is unavailable or fails. */
  fingerprint: { hash: string | null; error?: string };
}

/** Classification of one installed package's impact on the native surface. */
export type InstallImpact = 'js-only' | 'native-module' | 'config-plugin';

export interface InstallImpactReport {
  packageName: string;
  impact: InstallImpact;
  /** Bundled in Expo Go for the project's SDK (per bundledNativeModules.json). */
  expoGoBundled: boolean;
  /** What must rerun after installing this package. */
  action: 'none' | 'reload' | 'prebuild-and-build' | 'native-sync';
  reasons: string[];
}

/** Rough duration class, for plan-with-cost display. Never a precise estimate. */
export type TimeClass = 'seconds' | 'a-minute' | 'minutes' | 'many-minutes';

/** One executable step of a smart start plan. `argv` is always an Expo-family CLI
 * invocation run as a subprocess (process boundary, llp/0001 constraint 5). */
export interface PlanStep {
  id: string;
  /** e.g. ["expo", "prebuild", "--platform", "ios"] — argv[0] names the CLI. */
  argv: string[];
  reason: string;
  timeClass: TimeClass;
}

export interface StartPlan {
  target: ProjectTarget;
  steps: PlanStep[];
  /** Decision-table row that produced this plan, for tests and debugging. */
  rule: string;
  reasons: string[];
}
