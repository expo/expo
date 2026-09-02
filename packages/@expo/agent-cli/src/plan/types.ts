// @ref llp/0004-smart-start-and-project-state.rfc.md §Decision table
// Types local to the plan engine. The shared probe/plan contract lives in `src/project/types.ts`.

import type { BuildBackendChoice } from '../toolchain/selectBackend';
import type { RunTargetChoice } from './runTarget';

/** A platform that needs a native app to run the project. */
export type NativePlatform = 'ios' | 'android';

/** A platform the plan engine can target. */
export type PlanPlatform = NativePlatform | 'web';

/**
 * The fingerprint hash of the last development build `@expo/agent-cli` ran, per platform.
 *
 * @see ./lastBuild.ts for the `.expo` file this is read from.
 */
export type LastBuildFingerprints = Partial<Record<NativePlatform, string>>;

/**
 * The row of the decision table that produced a plan.
 *
 * @see llp/0004-smart-start-and-project-state.rfc.md §Decision table
 */
export type StartPlanRule =
  /**
   * This directory declares no `expo` dependency, so there is no app to plan for.
   *
   * @see llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app
   */
  | 'not-expo-app'
  /** Web needs no native app, so the dev server is the whole plan. */
  | 'web'
  /** Expo Go can run the project as-is. */
  | 'expo-go'
  /** A development build exists for the current fingerprint. */
  | 'dev-client-fresh'
  /** The native project must be generated and built before the app can run. */
  | 'dev-client-stale'
  /** Native directories are checked in and match the last build. */
  | 'bare-fresh'
  /** Native directories are checked in and must be built. */
  | 'bare-stale'
  /** The project cannot run in Expo Go and has no `expo-dev-client` dependency yet. */
  | 'needs-dev-client';

export interface DecideStartPlanOptions {
  /**
   * The platform to plan for. The caller resolves it from the command line (`--ios`, `--android`,
   * `--web`) or from the host platform; the decision table itself reads no ambient state.
   */
  platform?: PlanPlatform;
  /**
   * The platform flag the caller actually typed, when they typed one.
   *
   * Distinct from {@link platform}, which is always set — the caller falls back to the host or to
   * the project's own native directories. Only a flag the user typed reaches `expo start`, and
   * `expo start --ios` does something the plain form does not: it opens the app on a simulator,
   * booting one and installing Expo Go if it has to [observed — `@expo/cli`
   * `openPlatforms.ts` → `PlatformManager.openProjectInExpoGoAsync`]. The plan has to show the flag
   * in the argv it prints, because the command really does run with it.
   */
  requestedPlatform?: PlanPlatform;
  /**
   * Fingerprint hashes of the last builds `@expo/agent-cli` ran. Passed in by the caller so the
   * decision table stays a pure function of probed state.
   */
  lastBuild?: LastBuildFingerprints;
  /**
   * Where this plan's native build runs, when the caller has resolved it.
   *
   * The **selection happens here, at planning time**, and never mid-run: a plan whose steps say
   * `eas build` is the plan an agent approves and the plan that runs (llp/0004 §Plan contract,
   * [[0008-guardrails]]). Passed in rather than computed, because the choice depends on the host
   * and on a config file, and this table is a pure function of probed *project* state.
   *
   * `undefined` keeps the pre-selection behaviour — a local build, labelled as one — which is what
   * every caller that plans no build gets.
   *
   * @see llp/0015-backend-selection-and-config.rfc.md §The selection
   */
  buildBackend?: BuildBackendChoice | null;
  /**
   * Which app to aim for, when somebody asked for one.
   *
   * `null`/absent is the normal case: the table decides from the project's own facts. A
   * `dev-build` choice is the one that changes a plan that would otherwise have worked — a project
   * Expo Go can run is planned as a development build instead.
   *
   * @see ./runTarget.ts
   */
  runTarget?: RunTargetChoice | null;
  /**
   * Whether the project has an `eas.json`.
   *
   * Only read by the EAS route, which cannot start `eas build --profile development` without a
   * file defining that profile. Absent means "nobody looked", and the plan then assumes there is
   * one rather than adding a configure step that may be pointless.
   */
  easJson?: boolean;
}
