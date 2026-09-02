// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
// @ref llp/0017-deferred-commands.reference.md §doctor:fix — The tier table
// What `doctor:fix` may reset, as data. One entry per step: which tier admits it, what it deletes,
// what puts it back, and what it costs.
//
// Everything here is pure: a step names its targets from a description of the machine rather than
// by looking at one, so the whole table — including the platform filtering — is unit-testable
// without a filesystem. `fixPlan.ts` is what probes.

import { createHash } from 'crypto';
import path from 'path';

import type { TimeClass } from '../../project/types';
import type { FixPhase, FixScope, FixStepKind, FixTier } from './fixTypes';
import { installArgv } from './packageManager';

/** A native platform a step may be scoped to. */
export type NativePlatform = 'ios' | 'android';

/** Everything a step needs to name its targets, with nothing read from the machine here. */
export interface FixStepContext {
  /** Absolute project root. */
  projectRoot: string;
  /** Absolute `os.tmpdir()`. */
  tmpDir: string;
  /** Absolute home directory. */
  homeDir: string;
  /** `process.platform`. */
  platform: NodeJS.Platform;
  /** The native platforms this run covers, from `--platform` or from the directories present. */
  platforms: NativePlatform[];
  /** Native directories checked into the project. A bare project has at least one. */
  nativeDirs: { ios: boolean; android: boolean };
  /** Whether `ios/Podfile` exists, which is what makes a `pod install` meaningful. */
  hasPodfile: boolean;
  /** Xcode project names found in `ios/`, e.g. `["MyApp"]`. Empty for a CNG project. */
  xcodeProjectNames: string[];
  /** Whether `watchman` was found on `PATH`. */
  hasWatchman: boolean;
  /** The package manager reinstalling this project, and where its install runs. */
  packageManager: { name: string; installCwd: string };
}

/** One place a step's targets are found. */
export type TargetSpec =
  /** Exactly this path. */
  | { kind: 'path'; path: string }
  /** Every entry of `dir` whose name starts with `prefix`. */
  | { kind: 'prefix'; dir: string; prefix: string };

/** One row of the tier table. */
export interface FixStepDefinition {
  id: string;
  /** The weakest tier that includes this step. Tiers are cumulative. */
  tier: FixTier;
  kind: FixStepKind;
  phase: FixPhase;
  scope: FixScope;
  /**
   * Order among the `install` steps, lowest first. Only `install` steps need one: the `clean`
   * steps delete disjoint paths and the machine-wide ones run last whatever they do.
   */
  installOrder?: number;
  timeClass: TimeClass;
  reason: string;
  recoverable: string;
  /** Platforms this step exists on at all. Absent means every platform. */
  onlyPlatforms?: NodeJS.Platform[];
  /**
   * Native directories this step deletes inside, which is what makes it subject to the
   * dirty-tracked-native refusal of llp/0017 §doctor:fix — Path safety.
   */
  touchesNative?: (context: FixStepContext) => NativePlatform[];
  /** Where this step's targets are, before anything checks whether they exist. */
  targets?: (context: FixStepContext) => TargetSpec[];
  /** The subprocess this step runs. `argv[0]` is `expo` for a step of the Expo CLI. */
  argv?: (context: FixStepContext) => string[];
  /** Where {@link argv} runs, when that is not the project root. */
  cwd?: (context: FixStepContext) => string;
  /**
   * Why this project cannot have this step, or null when it can.
   *
   * A sentence, and it lands in the plan's `skipped` list verbatim: "this step was not planned" is
   * a fact an agent has to be able to act on, and the reason is what makes it actionable.
   */
  unavailable?: (context: FixStepContext) => string | null;
}

/**
 * The name Metro's file map cache goes under for one project.
 *
 * `metro-file-map-expo-<md5 of the project root>-<md5 of the config>` [observed —
 * `@expo/metro-file-map` `DiskCacheManager.getCacheFilePath` joins `DEFAULT_PREFIX`, the fixed
 * `expo`, and the two hashes of `rootRelativeCacheKeys`]. Only the first hash is computable from
 * outside — the second covers Metro's whole resolved config — which is why the target is a prefix
 * and not a path.
 *
 * Verified live on this machine, 2026-08-24: the md5 of four project roots reproduced four of the
 * five `metro-file-map-expo-*` directories in `$TMPDIR` exactly. That is what makes this target
 * project-scoped rather than a glob over everyone's caches, and it is why the documented
 * `$TMPDIR/haste-map-*` clears nothing: no file has been called that in years.
 */
export function metroFileMapPrefixes(projectRoot: string): string[] {
  const rootDirHash = createHash('md5').update(projectRoot.split(path.sep).join('/')).digest('hex');
  // The Bun fork of the prefix exists because the v8 serialization formats differ, so a project
  // bundled under both runtimes has two caches [observed — `DiskCacheManager` `DEFAULT_PREFIX`].
  return [`metro-file-map-expo-${rootDirHash}-`, `metro-file-map-bun-expo-${rootDirHash}-`];
}

/** Every step, in table order. {@link planOrder} is what decides when each one runs. */
export const FIX_STEPS: FixStepDefinition[] = [
  {
    id: 'expo-web-cache',
    tier: 'safe',
    kind: 'delete',
    phase: 'clean',
    scope: 'project',
    timeClass: 'seconds',
    reason: 'A stale web bundle cache serves the code of an earlier edit to the browser.',
    recoverable: 'rebuilt on the next web bundle',
    targets: ({ projectRoot }) => [
      { kind: 'path', path: path.join(projectRoot, '.expo', 'web', 'cache') },
    ],
  },
  {
    id: 'expo-dev-logs',
    tier: 'safe',
    kind: 'delete',
    phase: 'clean',
    scope: 'project',
    timeClass: 'seconds',
    reason: 'Log files from earlier runs, kept only so the last run can be read back.',
    recoverable: 'recreated by the next command that logs',
    targets: ({ projectRoot }) => [
      { kind: 'path', path: path.join(projectRoot, '.expo', 'dev', 'logs') },
    ],
  },
  {
    id: 'node-modules-cache',
    tier: 'safe',
    kind: 'delete',
    phase: 'clean',
    scope: 'project',
    timeClass: 'seconds',
    reason: 'Whatever babel, jest and their neighbours cached under node_modules for this project.',
    recoverable: 'rebuilt by the tools that wrote it',
    // Exactly this directory, for the reason the `node-modules` step below states: a cache is
    // deleted, not resolved, and an ancestor's belongs to the whole workspace.
    targets: ({ projectRoot }) => [
      { kind: 'path', path: path.join(projectRoot, 'node_modules', '.cache') },
    ],
  },
  {
    id: 'metro-file-map',
    tier: 'safe',
    kind: 'delete',
    phase: 'clean',
    scope: 'project',
    timeClass: 'seconds',
    reason: 'A stale file map makes Metro miss files that were renamed, moved or deleted.',
    recoverable: 'regenerated on the next dev server start',
    targets: ({ projectRoot, tmpDir }) =>
      metroFileMapPrefixes(projectRoot).map((prefix) => ({
        kind: 'prefix' as const,
        dir: tmpDir,
        prefix,
      })),
  },
  {
    id: 'watchman-project',
    tier: 'safe',
    kind: 'command',
    phase: 'clean',
    scope: 'project',
    timeClass: 'seconds',
    reason: 'A watch that has drifted from the directory it watches stops reporting file changes.',
    recoverable: 'watchman starts a new watch on the next dev server start',
    argv: ({ projectRoot }) => ['watchman', 'watch-del', projectRoot],
    unavailable: ({ hasWatchman }) =>
      hasWatchman ? null : 'watchman is not installed on this machine, so it watches nothing.',
  },
  {
    id: 'metro-transform-cache',
    tier: 'moderate',
    kind: 'delete',
    phase: 'clean',
    // `path.join(os.tmpdir(), 'metro-cache')` is one directory shared by every project on the
    // machine [observed — `packages/@expo/metro-config/src/ExpoMetroConfig.ts`], so clearing it
    // makes every *other* project's next build slow too.
    scope: 'machine',
    timeClass: 'seconds',
    reason: 'Metro serves a transformed module from here without re-reading the source.',
    recoverable: 'rebuilt on the next bundle, for every project on this machine',
    targets: ({ tmpDir }) => [{ kind: 'path', path: path.join(tmpDir, 'metro-cache') }],
  },
  {
    id: 'node-modules',
    tier: 'moderate',
    kind: 'delete-and-reinstall',
    phase: 'install',
    installOrder: 0,
    scope: 'project',
    timeClass: 'minutes',
    reason:
      'A partial or mismatched install is the most common cause of a red screen after an upgrade.',
    recoverable: 'reinstalled by this step',
    // **Exactly this directory**, deliberately, where the bin resolvers walk up
    // (`src/utils/projectBin.ts`, F113). This names a directory to *delete*, and a workspace root's
    // `node_modules` holds the dependencies of every package in the repository — deleting it would
    // put this step's `scope: 'project'` in writing and break the other packages in fact. The
    // reinstall still runs at the lockfile's directory (`installCwd`), which is what puts back
    // whatever the manager hoisted.
    targets: ({ projectRoot }) => [{ kind: 'path', path: path.join(projectRoot, 'node_modules') }],
    argv: ({ packageManager }) => installArgv(packageManager.name),
    cwd: ({ packageManager }) => packageManager.installCwd,
  },
  {
    id: 'ios-pods',
    tier: 'moderate',
    kind: 'delete-and-reinstall',
    phase: 'install',
    installOrder: 1,
    scope: 'project',
    timeClass: 'minutes',
    onlyPlatforms: ['darwin'],
    reason:
      'Pods pinned to packages that are no longer installed fail the build with a link error.',
    recoverable: 'reinstalled by this step',
    targets: ({ projectRoot }) => [
      { kind: 'path', path: path.join(projectRoot, 'ios', 'Pods') },
      { kind: 'path', path: path.join(projectRoot, 'ios', 'Podfile.lock') },
    ],
    argv: () => ['pod', 'install'],
    cwd: ({ projectRoot }) => path.join(projectRoot, 'ios'),
    touchesNative: () => ['ios'],
    unavailable: (context) => {
      if (!context.platforms.includes('ios')) {
        return 'ios is not in --platform.';
      }
      // CNG has no Podfile of its own: `expo prebuild` writes one and runs `pod install` itself
      // [observed — `packages/@expo/cli/src/utils/cocoapods.ts`], so the aggressive tier's
      // `prebuild-clean` is what resets pods there.
      return context.hasPodfile
        ? null
        : 'No ios/Podfile. This is a CNG project, where expo prebuild installs the pods.';
    },
  },
  {
    id: 'android-build',
    tier: 'moderate',
    kind: 'delete',
    phase: 'clean',
    scope: 'project',
    timeClass: 'a-minute',
    reason: 'Gradle output from an earlier native surface, which a new build has to invalidate.',
    recoverable: 'rebuilt by the next android build',
    targets: ({ projectRoot }) => [
      { kind: 'path', path: path.join(projectRoot, 'android', 'build') },
      { kind: 'path', path: path.join(projectRoot, 'android', 'app', 'build') },
      { kind: 'path', path: path.join(projectRoot, 'android', '.gradle') },
    ],
    touchesNative: () => ['android'],
    unavailable: (context) => {
      if (!context.platforms.includes('android')) {
        return 'android is not in --platform.';
      }
      return context.nativeDirs.android
        ? null
        : 'No android/ directory. This is a CNG project, where the native project is generated.';
    },
  },
  {
    id: 'prebuild-clean',
    tier: 'aggressive',
    kind: 'command',
    phase: 'install',
    installOrder: 2,
    scope: 'project',
    timeClass: 'many-minutes',
    reason: 'Regenerates the native projects from the app config and the installed plugins.',
    recoverable: 'the native directories are regenerated by this step',
    argv: ({ platforms }) => [
      'expo',
      'prebuild',
      '--clean',
      '--platform',
      platforms.length === 1 ? platforms[0]! : 'all',
    ],
    touchesNative: ({ platforms }) => platforms,
    unavailable: (context) => {
      if (!context.platforms.length) {
        return 'No platform to prebuild.';
      }
      // `--clean` deletes the native directories [observed —
      // `packages/@expo/cli/src/prebuild/index.ts`]. In a bare project those are the project, and
      // no cache reset is worth regenerating hand-written native code over.
      return context.nativeDirs.ios || context.nativeDirs.android
        ? 'The native directories are checked into this project, and prebuild --clean would replace them.'
        : null;
    },
  },
  {
    id: 'derived-data',
    tier: 'aggressive',
    kind: 'delete',
    phase: 'clean',
    // The directory name is `<scheme>-<hash>`, and the hash is derived from the project's path in
    // a way only Xcode computes, so the match is by prefix. A second project with the same scheme
    // name has a directory with the same prefix, which is why this needs the flag.
    scope: 'machine',
    timeClass: 'seconds',
    onlyPlatforms: ['darwin'],
    reason: 'Xcode reuses a stale module cache and stale build products from here.',
    recoverable: 'rebuilt by the next Xcode build, which is a full one',
    targets: ({ homeDir, xcodeProjectNames }) =>
      xcodeProjectNames.map((name) => ({
        kind: 'prefix' as const,
        dir: path.join(homeDir, 'Library', 'Developer', 'Xcode', 'DerivedData'),
        prefix: `${name}-`,
      })),
    unavailable: ({ xcodeProjectNames }) =>
      xcodeProjectNames.length
        ? null
        : 'No .xcodeproj in ios/, so the DerivedData directory of this project cannot be named.',
  },
  {
    id: 'watchman-all',
    tier: 'aggressive',
    kind: 'command',
    phase: 'clean',
    scope: 'machine',
    timeClass: 'seconds',
    reason: 'Drops every watch on this machine, including the ones other projects rely on.',
    recoverable: 'each project starts a new watch on its next dev server start',
    argv: () => ['watchman', 'watch-del-all'],
    unavailable: ({ hasWatchman }) =>
      hasWatchman ? null : 'watchman is not installed on this machine, so it watches nothing.',
  },
];

/**
 * Steps the docs name and this command deliberately leaves out.
 *
 * Named in `--help` rather than dropped silently: the official reset page lists them
 * [observed — `docs/pages/troubleshooting/clear-cache-macos-linux.mdx`], so a reader who knows the
 * page has to be told they were a decision.
 */
export const EXCLUDED_STEPS: { command: string; reason: string }[] = [
  {
    command: 'npm cache clean --force',
    reason:
      'machine-wide, minutes to re-download, and a corrupt npm cache is not what a stale bundle is',
  },
  {
    command: 'yarn cache clean',
    reason: 'the same, for yarn',
  },
];

/** Whether a tier includes a step, tiers being cumulative. */
export function tierIncludes(tier: FixTier, stepTier: FixTier): boolean {
  const rank: Record<FixTier, number> = { safe: 0, moderate: 1, aggressive: 2 };
  return rank[stepTier] <= rank[tier];
}

/**
 * When one step runs, relative to the others.
 *
 * The four ordering rules of llp/0017 §doctor:fix are this function, derived from what a step declares it *is*
 * rather than from a hand-kept list a new step could be left out of:
 *
 * 1. every deletion runs before any reinstall — `clean` outranks `install`;
 * 2. `node_modules` is reinstalled before `ios/Pods`, because the Podfile reads from it;
 * 3. `prebuild-clean` runs after `node_modules`, because prebuild reads the installed packages;
 * 4. machine-wide steps run last, so a failure there leaves the project steps already done.
 *
 * Rule 4 wins over rule 1 where they disagree — a machine-wide deletion after a project reinstall
 * costs nothing, and a machine-wide failure before one would have cost the reinstall.
 */
export function planOrder(step: FixStepDefinition): number {
  if (step.scope === 'machine') {
    return 300;
  }
  return step.phase === 'clean' ? 100 : 200 + (step.installOrder ?? 0);
}

/** The steps of one tier that exist on one platform at all, in the order they would run. */
export function stepsForTier(tier: FixTier, platform: NodeJS.Platform): FixStepDefinition[] {
  return FIX_STEPS.filter(
    (step) =>
      tierIncludes(tier, step.tier) &&
      (!step.onlyPlatforms || step.onlyPlatforms.includes(platform))
  ).sort((a, b) => planOrder(a) - planOrder(b));
}
