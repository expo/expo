// @ref llp/0011-impact-and-freshness.rfc.md
// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — the top-level keys of
// `ImpactReport` are the versioned surface of `impact --json`, pinned by a shape test.

import type { FollowUp } from '../followups/types';

/**
 * What a change costs, in the only three sizes that mean different things to a developer.
 *
 * Ordered weakest to strongest; {@link IMPACT_CLASS_ORDER} is what "stronger" means, and it is the
 * whole of `--assert`.
 */
export type ImpactClass = 'js-only' | 'dev-client-compatible' | 'needs-native-build';

/** Weakest first. An index into this is a class's strength. */
export const IMPACT_CLASS_ORDER: ImpactClass[] = [
  'js-only',
  'dev-client-compatible',
  'needs-native-build',
];

/** Whether `a` costs more than `b`. */
export function isStrongerClass(a: ImpactClass, b: ImpactClass): boolean {
  return IMPACT_CLASS_ORDER.indexOf(a) > IMPACT_CLASS_ORDER.indexOf(b);
}

/**
 * Why a source contributes the class it does.
 *
 * A finer answer than the class, because two things that both need a native build need *different*
 * next commands: an autolinked module needs a prebuild and a build, while an `eas.json` edit needs
 * only a new cloud build.
 */
export type ChangeKind =
  | 'native-module'
  | 'native-project'
  | 'config-plugin'
  | 'app-config'
  | 'build-config'
  | 'build-scripts'
  | 'unknown';

/** One entry of the fingerprint diff, as the report carries it. */
export interface ChangedSource {
  op: 'added' | 'removed' | 'changed';
  /** `file`, `dir`, `contents` or `package`, as the fingerprint CLI typed it. Null when absent. */
  type: string | null;
  /** The file, the contents id, or the package name — whichever identifies this source. */
  path: string | null;
  reasons: string[];
  kind: ChangeKind;
  class: ImpactClass;
}

/** How the two sides of the comparison were obtained. */
export type ComparisonKind = 'last-build' | 'eas-build' | 'git-refs';

/** One side of the comparison. */
export interface ComparisonSide {
  /** What a person would call it: `recorded build`, `working tree`, `EAS build <id>`. */
  label: string;
  hash: string | null;
}

/** A finished EAS build whose fingerprint already matches the head. */
export interface CachedBuild {
  id: string | null;
  status: string | null;
  platform: string | null;
  buildProfile: string | null;
  createdAt: string | null;
  buildUrl: string | null;
}

/** The per-platform answer. */
export interface PlatformImpact {
  /**
   * The platform this entry is about, or `null` when the comparison was not per-platform.
   *
   * `null` is the `--build` case: `eas fingerprint:compare --build-id` compares one build against
   * the working directory and takes no platform, because a build was made for exactly one and
   * which one is a fact about the build. Naming a platform this CLI did not establish would be an
   * invention; `--platform ios` alongside `--build` fills it in, because then the caller said so.
   */
  platform: 'ios' | 'android' | null;
  class: ImpactClass;
  /**
   * Whether the native fingerprint moved. `null` when it could not be decided — no base recorded,
   * no fingerprint CLI, a failed run — which is not the same as `false` and never reads as one.
   */
  fingerprintChanged: boolean | null;
  baseHash: string | null;
  headHash: string | null;
  changedSources: ChangedSource[];
  /** One sentence per finding, in the order they were found. */
  reasons: string[];
  /** A finished build EAS already has for {@link headHash}, when the lookup found one. */
  cachedBuild: CachedBuild | null;
  /** Why this platform could not be answered exactly. Empty when nothing was approximated. */
  caveats: string[];
}

/** How `runtimeVersion` was resolved, and from where. */
export interface RuntimeVersionInfo {
  /** `fingerprint`, `appVersion`, `sdkVersion`, `nativeVersion`, or null for a literal/absent. */
  policy: string | null;
  /** The literal value, when the config names one instead of a policy. */
  literal: string | null;
  /** Where it was read: `expo config --type public`, `app.json`, or null when nothing answered. */
  source: string | null;
}

/**
 * Whether an update published now would reach builds that can run it.
 *
 * Deliberately **not** derived from {@link PlatformImpact.class}: a fingerprint change answers
 * "does the native binary differ", and OTA safety is a `runtimeVersion` question. The two coincide
 * only under `policy: "fingerprint"`. See llp/0011 §A fingerprint change is not "OTA-unsafe".
 */
export interface OtaSafety {
  /** `null` when the policy could not be resolved, which is not "safe". */
  safe: boolean | null;
  runtimeVersion: RuntimeVersionInfo;
  /** One sentence naming the policy and what it implies for an update published now. */
  why: string;
}

/** How many files changed, and of what sort. Null when no file-level view was available. */
export interface ChangedFiles {
  total: number;
  native: number;
  js: number;
  config: number;
}

/** The one JSON object `impact --json` prints. */
export interface ImpactReport {
  projectRoot: string;
  comparison: {
    kind: ComparisonKind;
    base: ComparisonSide;
    head: ComparisonSide;
    /**
     * The fingerprint preset both sides were computed under.
     *
     * The caller's `--preset` when they named one. Otherwise the preset the fingerprint CLI
     * applies by itself, reported because a comparison is only meaningful within one preset — but
     * not passed to it, because the flag postdates the published CLI most projects have.
     */
    preset: string;
  };
  platforms: PlatformImpact[];
  ota: OtaSafety;
  /** The strongest class across the platforms asked about. */
  class: ImpactClass;
  changedFiles: ChangedFiles | null;
  /**
   * What this answer could not establish exactly, in the caller's terms.
   *
   * Always present, always the same key. The precision limits of llp/0011 are reported here rather
   * than only documented, because the reader of the payload is the one who has to know them.
   */
  caveats: string[];
  /** The class `--assert` was given, and whether the real one is at most that. Null without it. */
  assertion: { asserted: ImpactClass; ok: boolean } | null;
  followups: FollowUp[];
}
