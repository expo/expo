// @ref llp/0004-smart-start-and-project-state.rfc.md §Decision table
// Types local to the plan engine. The shared probe/plan contract lives in `src/project/types.ts`.

/** A platform that needs a native app to run the project. */
export type NativePlatform = 'ios' | 'android';

/** A platform the plan engine can target. */
export type PlanPlatform = NativePlatform | 'web';

/**
 * The fingerprint hash of the last development build `exagent` ran, per platform.
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
   * Fingerprint hashes of the last builds `exagent` ran. Passed in by the caller so the
   * decision table stays a pure function of probed state.
   */
  lastBuild?: LastBuildFingerprints;
}
