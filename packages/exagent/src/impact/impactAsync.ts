// @ref llp/0011-impact-and-freshness.rfc.md
// `exagent impact`: what does this change cost, and can it be shipped over the air?
//
// Two questions, deliberately answered by two different mechanisms. The **class** comes from the
// fingerprint — did the native surface move — and the **OTA verdict** comes from the
// `runtimeVersion` policy, which is a different fact about a different system. `impact` reports
// both and never derives one from the other; llp/0011 §A fingerprint change is not "OTA-unsafe"
// is why.

import { event } from '../events';
import { exitWithCodeAsync, EXIT_OUTCOME_FAILED } from '../exitCodes';
import { buildImpactFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import * as Log from '../log';
import { readProjectNativeDirsAsync } from '../project/nativeCode';
import { resolveEasCli } from '../utils/easCli';
import { CommandError } from '../utils/errors';
import { findCachedBuildAsync } from './buildCache';
import { classifyChangedFiles, classifyFingerprintDiff } from './classify';
import type { FileClassification } from './classify';
import { listChangedFilesAsync } from './changedFiles';
import { compareWithEasBuildAsync, compareWithLastBuildAsync, type Comparison } from './compare';
import { formatImpactReport } from './format';
import { DEFAULT_PRESET, type ImpactOptions } from './resolveOptions';
import { resolveOtaSafety, resolveRuntimeVersionAsync } from './runtimeVersion';
import type { ImpactClass, ImpactReport, PlatformImpact, RuntimeVersionInfo } from './types';
import { IMPACT_CLASS_ORDER, isStrongerClass } from './types';

/** Report what a change costs, and leave the process with `0` — or with `20` under `--assert`. */
export async function impactAsync(projectRoot: string, options: ImpactOptions): Promise<void> {
  if (options.mode === 'git-refs') {
    throw gitRefsUnavailable();
  }

  const platforms = await resolvePlatformsAsync(projectRoot, options);
  // Opportunistic, never required: a machine with no EAS CLI gets the report without the
  // build-cache line rather than an error. `--build` is the one mode that genuinely needs it, and
  // it says so with the error of its own below.
  const easCli = resolveEasCli(projectRoot);
  if (options.mode === 'eas-build' && !easCli) {
    throw easRequired(options.buildId!);
  }

  const results: PlatformImpact[] = [];
  if (options.mode === 'eas-build') {
    // Once, not once per platform: `eas fingerprint:compare --build-id` takes no platform, because
    // the build was made for exactly one and which one is a fact about the build. Running it per
    // platform would spawn the identical command twice and report one answer as two.
    const comparison = await compareWithEasBuildAsync(easCli!, projectRoot, options.buildId!);
    results.push(
      await buildPlatformImpactAsync(
        easCli,
        projectRoot,
        options.platform === 'all' ? null : options.platform,
        comparison
      )
    );
  } else {
    for (const platform of platforms) {
      const comparison = await compareWithLastBuildAsync(projectRoot, platform, {
        preset: options.preset ?? undefined,
      });
      results.push(await buildPlatformImpactAsync(easCli, projectRoot, platform, comparison));
    }
  }

  // The file-level view is what is left when the fingerprint said the native surface is
  // *unchanged* — `=== false`, not merely falsy. A platform whose comparison could not be decided
  // has not established anything for the files to refine, and letting `null` through here is what
  // made a project with no recorded build report a cheap class it had no evidence for.
  // It runs once, not per platform: git does not have a per-platform answer.
  const changed = results.every((result) => result.fingerprintChanged === false)
    ? await listChangedFilesAsync(projectRoot)
    : null;
  const changedFiles = changed?.files ?? null;
  const fileClass = changedFiles ? classifyChangedFiles(changedFiles) : null;

  const runtimeVersion = await resolveRuntimeVersionAsync(projectRoot);
  const report = buildImpactReport({
    projectRoot,
    options,
    platforms: results,
    fileClass,
    changedFilesKnown: changedFiles != null,
    // Why there is no file-level view, in the words of what actually happened. `null` here means
    // the fingerprint already decided and nothing looked (F60).
    changedFilesGap: changed?.gap ?? null,
    changedFilesDetail: changed?.detail ?? null,
    runtimeVersion,
  });

  event('impact', {
    mode: options.mode,
    class: report.class,
    otaSafe: report.ota.safe,
    runtimeVersionPolicy: runtimeVersion.policy,
    platforms: results.map((result) => result.platform ?? 'unspecified'),
    fingerprintChanged: resolveOverallFingerprintChanged(results),
    assertion: report.assertion,
  });

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    Log.log(formatImpactReport(report));
  }

  reportFollowUps('impact', report.followups, { json: options.json });

  if (report.assertion && !report.assertion.ok) {
    // llp/0010 §Exit codes: the tool worked and the operation — the gate — did not pass, which is
    // the `20`–`29` band. Not `1`: nothing about the call was wrong, so there is nothing to fix
    // about it, and `1` would send an agent looking for a usage mistake it did not make.
    await exitWithCodeAsync(EXIT_OUTCOME_FAILED);
  }
}

export interface BuildImpactReportInput {
  projectRoot: string;
  options: ImpactOptions;
  /** The per-platform answers, in the order they were classified. Mutated to fold in `fileClass`. */
  platforms: PlatformImpact[];
  /** The file-level answer, or `null` when the fingerprint already decided or git could not say. */
  fileClass: FileClassification | null;
  /** Whether the changed-file list was readable at all, which decides a caveat. */
  changedFilesKnown: boolean;
  /** Why the file-level view is missing, or null when it was never needed. */
  changedFilesGap?: 'not-a-work-tree' | 'git-failed' | null;
  /** What happened, in one clause, for the caveat. */
  changedFilesDetail?: string | null;
  runtimeVersion: RuntimeVersionInfo;
}

/**
 * The one JSON object the command prints.
 *
 * Pure, and exported for the shape test: the top-level keys are the de-facto version of this
 * command (llp/0006 §Output contract), and they must not depend on how the run went — an agent
 * reading `ota.safe` after a comparison that found nothing gets a value, not a missing key.
 */
export function buildImpactReport({
  projectRoot,
  options,
  platforms,
  fileClass,
  changedFilesKnown,
  changedFilesGap = null,
  changedFilesDetail = null,
  runtimeVersion,
}: BuildImpactReportInput): ImpactReport {
  // A platform whose fingerprint did not move falls through to the file-level answer, which is
  // the only thing that can tell "Fast Refresh picks it up" from "restart Metro". A platform whose
  // fingerprint *did* move already has the stronger answer and keeps it.
  if (fileClass) {
    for (const result of platforms) {
      if (result.class === 'js-only') {
        result.class = fileClass.class;
        result.reasons = [...result.reasons, ...fileClass.reasons];
      }
    }
  }

  const impactClass = resolveOverallClass(platforms, fileClass?.class ?? null);
  const ota = resolveOtaSafety(runtimeVersion, resolveOverallFingerprintChanged(platforms));

  return {
    projectRoot,
    comparison: {
      kind: options.mode,
      base: { label: baseLabel(options), hash: platforms[0]?.baseHash ?? null },
      head: { label: 'working tree', hash: platforms[0]?.headHash ?? null },
      // The caller's preset when they named one, and otherwise the one the fingerprint CLI applies
      // by itself — reported either way, because a comparison only means something within one
      // preset, and passed only in the first case.
      preset: options.preset ?? DEFAULT_PRESET,
    },
    platforms,
    ota,
    class: impactClass,
    changedFiles: fileClass?.counts ?? null,
    caveats: buildCaveats(platforms, options, changedFilesKnown, changedFilesGap, changedFilesDetail),
    assertion: options.assert
      ? { asserted: options.assert, ok: !isStrongerClass(impactClass, options.assert) }
      : null,
    followups: followUpsEnabled(options.followups)
      ? buildImpactFollowUps({
          impactClass,
          otaSafe: ota.safe,
          cachedBuild: platforms.find((result) => result.cachedBuild)?.cachedBuild ?? null,
          platform: platforms.length === 1 ? platforms[0]!.platform : null,
        })
      : [],
  };
}

/** One platform's answer, with the build-cache line attached when EAS had one. */
async function buildPlatformImpactAsync(
  easCli: ReturnType<typeof resolveEasCli>,
  projectRoot: string,
  platform: 'ios' | 'android' | null,
  comparison: Comparison
): Promise<PlatformImpact> {
  if (comparison.error) {
    throw new CommandError('IMPACT_COMPARE_FAILED', comparison.error);
  }

  const classified = comparison.items ? classifyFingerprintDiff(comparison.items) : null;
  // An *undecided* fingerprint is `needs-native-build`, not `js-only`. Nothing has been shown
  // about the native surface, and llp/0004 §Implemented in v1 as, item 2 already fixed the
  // direction to err in for exactly this state: unrecorded means stale, so the answer over-plans a
  // build at worst and never under-plans one. It also keeps this command from contradicting
  // `exagent dev`, which plans a build for the same project.
  const impactClass: ImpactClass = classified
    ? classified.class
    : comparison.fingerprintChanged === false
      ? 'js-only'
      : 'needs-native-build';

  const reasons = classified
    ? classified.reasons
    : comparison.fingerprintChanged
      ? [
          `the native fingerprint${platform ? ` for ${platform}` : ''} differs from the one this is compared against, so the installed app was built from different native code`,
        ]
      : comparison.fingerprintChanged == null
        ? [
            `whether the native surface changed${platform ? ` for ${platform}` : ''} could not be established, so this reports the answer that is safe to be wrong about: build again rather than run code the installed app may not support`,
          ]
        : [];

  return {
    platform,
    class: impactClass,
    fingerprintChanged: comparison.fingerprintChanged,
    baseHash: comparison.base.hash,
    headHash: comparison.head.hash,
    changedSources: classified?.changedSources ?? [],
    reasons,
    // Only worth asking when a build would otherwise be needed, and only when the platform is
    // known: `eas build:list --fingerprint-hash` needs one, and a `--build` comparison that named
    // no platform has none to give it.
    cachedBuild:
      impactClass === 'needs-native-build' && platform
        ? await findCachedBuildAsync(easCli, projectRoot, platform, comparison.head.hash)
        : null,
    caveats: comparison.caveats,
  };
}

/**
 * The platforms to classify.
 *
 * A bare project owns its native directories, so the ones it has are the ones it targets. A CNG
 * project has neither and can generate both, so both are reported: `impact` is asked before a
 * build, and which platform that build is for is not something the project states.
 */
async function resolvePlatformsAsync(
  projectRoot: string,
  options: ImpactOptions
): Promise<('ios' | 'android')[]> {
  if (options.platform !== 'all') {
    return [options.platform];
  }
  const nativeDirs = await readProjectNativeDirsAsync(projectRoot);
  if (nativeDirs.ios || nativeDirs.android) {
    return (['ios', 'android'] as const).filter((platform) => nativeDirs[platform]);
  }
  return ['ios', 'android'];
}

/** The strongest class across the platforms, and the file-level answer when nothing is stronger. */
function resolveOverallClass(
  results: PlatformImpact[],
  fileClass: ImpactClass | null
): ImpactClass {
  let strongest: ImpactClass = fileClass ?? IMPACT_CLASS_ORDER[0]!;
  for (const result of results) {
    if (isStrongerClass(result.class, strongest)) {
      strongest = result.class;
    }
  }
  return strongest;
}

/**
 * Whether the native surface moved, across the platforms asked about.
 *
 * `true` beats `null` beats `false`: one platform that certainly changed is a change, and an
 * undecidable platform beside an unchanged one leaves the whole answer undecidable rather than
 * letting the confident half speak for both.
 */
function resolveOverallFingerprintChanged(results: PlatformImpact[]): boolean | null {
  if (results.some((result) => result.fingerprintChanged === true)) {
    return true;
  }
  if (results.some((result) => result.fingerprintChanged == null)) {
    return null;
  }
  return results.length ? false : null;
}

function baseLabel(options: ImpactOptions): string {
  return options.mode === 'eas-build'
    ? `EAS build ${options.buildId}`
    : 'last build recorded by exagent';
}

/**
 * What this answer could not establish exactly.
 *
 * The precision limits of llp/0011 are reported in the payload rather than only documented,
 * because the reader of the payload is the one who has to know them. The per-platform caveats come
 * up here too, so a caller reading only the top level sees everything that was approximated.
 */
function buildCaveats(
  results: PlatformImpact[],
  options: ImpactOptions,
  changedFilesKnown: boolean,
  changedFilesGap: 'not-a-work-tree' | 'git-failed' | null = null,
  changedFilesDetail: string | null = null
): string[] {
  const caveats: string[] = [];
  for (const result of results) {
    for (const caveat of result.caveats) {
      if (!caveats.includes(caveat)) {
        caveats.push(caveat);
      }
    }
  }

  caveats.push(
    options.preset
      ? `Both sides are computed with the "${options.preset}" fingerprint preset, passed through to the fingerprint CLI. A preset decides what counts as part of the native surface, so a comparison across two presets is meaningless.`
      : `No --preset was given, so the fingerprint CLI applied its own default ("${DEFAULT_PRESET}" as of @expo/fingerprint 0.20.x). A preset decides what counts as part of the native surface, so a comparison across two presets is meaningless — and a project that changes its default between the recorded build and now would be compared across two.`
  );

  if (!changedFilesKnown && results.every((result) => !result.fingerprintChanged)) {
    // @ref ./changedFiles — friction run 6, F60. This sentence used to be printed for both causes,
    // so a project `checkpoint` had just snapshotted was told it had no repository.
    caveats.push(
      changedFilesGap === 'git-failed'
        ? `Which files changed could not be read: ${changedFilesDetail ?? 'git did not answer'}. This project *is* in a git work tree, so this is git failing rather than a project without a repository. The class comes from the fingerprint alone, which cannot tell a change Metro picks up from one that needs it restarted.`
        : `This project is not in a git work tree, so which files changed could not be read${changedFilesDetail ? ` (${changedFilesDetail})` : ''}. The class comes from the fingerprint alone, which cannot tell a change Metro picks up from one that needs it restarted.`
    );
  }

  if (options.mode === 'last-build') {
    caveats.push(
      `The fingerprint is computed from the dependencies installed right now, so it describes this working tree and not any other revision.`
    );
  }

  if (!options.profile) {
    caveats.push(
      `No --profile was given, so no eas.json build profile's environment variables were applied. A dynamic app.config.js that reads process.env can fingerprint differently under a build profile than it does here.`
    );
  } else {
    caveats.push(
      `--profile ${options.profile} names an eas.json profile, and the local fingerprint CLI has no way to apply its environment variables. Only "eas fingerprint:generate --build-profile" does. The profile is reported and not applied.`
    );
  }

  return caveats;
}

/** The error for `--base`, which this version does not implement. */
function gitRefsUnavailable(): CommandError {
  const error = new CommandError(
    'IMPACT_MODE_UNAVAILABLE',
    [
      `Comparing against a git ref is not available in this version.`,
      `Why: fingerprinting a revision means checking it out into a linked work tree and borrowing this one's node_modules, and a revision whose dependencies differ would be fingerprinted against the wrong module tree — an answer that looks exact and is not. @expo/fingerprint has no "--git-ref" of its own yet; the ask is recorded in llp/0010 §Upstream asks.`,
      `How: compare against the last build this CLI recorded by dropping --base, or against a cloud build with "--build <id>", which is server ground truth and needs no work tree.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent impact';
  return error;
}

function easRequired(buildId: string): CommandError {
  const error = new CommandError(
    'EAS_CLI_MISSING',
    [
      `The EAS CLI is not available, so build ${buildId} cannot be looked up.`,
      `Why: --build compares against the fingerprint EAS computed on its own servers, which only "eas fingerprint:compare" can read. Every other mode of this command works without it.`,
      `How: install it once with "npm install -g eas-cli", or drop --build to compare against the last build this CLI recorded.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npm install -g eas-cli';
  return error;
}
