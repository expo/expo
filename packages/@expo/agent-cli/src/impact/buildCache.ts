// @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
// "A finished build already exists for this exact fingerprint" — a materially better answer than
// "you need a native build", and the thing that closes the "No build-cache lookup" approximation
// of llp/0004 §Implemented in v1 as, item 2.
//
// `eas build:list --fingerprint-hash <hash>` is what makes it possible [observed — eas-cli README,
// v22.2.0]. `--json` implies `--non-interactive` there; both are passed anyway, because the
// implication is the other CLI's and this one does not depend on it.

import { easCliArgs, easCliLabel, mayDownloadEasCli, type EasCli } from '../utils/easCli';
import { spawnSubprocessAsync } from '../utils/subprocess';
import {
  looksLikeRunnerNoise,
  looksLikeWrapperCrash,
  runnerCrashReason,
  runnerNoiseLine,
  runnerNoiseReason,
} from '../utils/wrapperCrash';
import type { CachedBuild } from './types';

/**
 * How long the lookup may take before it is abandoned, for a caller that names no budget.
 *
 * **Unchanged by the move to a package runner** [decided — 2026-08-27, wave 18]. In a project that
 * does not pin `eas-cli` the lookup runs `npx --yes eas-cli@latest`, whose first run installs the
 * package before the query starts, and that can outlast this. The default stays anyway, because the
 * caller that takes it is `impact` — an *opportunistic* lookup decorating a report that is complete
 * without it, run without being asked for. Twenty seconds of a command's time is a fair ceiling on a
 * nicety; a minute is not.
 *
 * The caller that *did* ask — `status --explain` — passes a wider budget of its own
 * (`EAS_BUILD_RUNNER_TIMEOUT_MS`, `src/status/easBuilds.ts`). Either way a run that expires says the
 * download was why, via {@link runnerDownloadNote}, and says that the next run is warm — so the cost
 * of guessing this too low is a re-run, never a wrong answer.
 */
export const BUILD_CACHE_TIMEOUT_MS = 20_000;

/**
 * What a timeout adds to its reason when the CLI was being downloaded rather than merely slow.
 *
 * Exported because the two timeouts a lookup can hit are in different modules — this one's, and the
 * per-platform deadline `status` wraps it in (`src/status/easBuilds.ts`) — and a reader should not
 * be told two different things about the same minute.
 */
export function runnerDownloadNote(easCli: EasCli | null): string {
  if (!mayDownloadEasCli(easCli)) {
    return '';
  }
  // Both halves are real. `@latest` installs the package on a first run, and asks the registry on
  // every run — so a machine that cannot reach one spends the whole budget here [observed — live,
  // 2026-08-27: ~70 s before npm gave up]. A reader who cannot tell those apart re-runs and finds
  // out, which is why the sentence names both and promises nothing.
  return `, and "${easCliLabel(easCli!)}" was fetching the EAS CLI: the install happens once, so a re-run should answer — unless this machine cannot reach the npm registry, in which case pinning the CLI into the project ("npm install --save-dev eas-cli") is what makes this section work offline`;
}

/**
 * The argv of one build-cache lookup.
 *
 * Pinned by a unit test: `--status finished` is what makes a hit mean something — a queued or
 * errored build with the same fingerprint is not a build you can install — and `--limit 1` is what
 * keeps this cheap enough to run without asking.
 */
export function buildCacheArgs(platform: 'ios' | 'android', hash: string): string[] {
  return [
    'build:list',
    '--platform',
    platform,
    '--fingerprint-hash',
    hash,
    '--status',
    'finished',
    '--limit',
    '1',
    '--json',
    '--non-interactive',
  ];
}

/**
 * The three things a build-cache lookup can establish.
 *
 * @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup answers in three states
 * "EAS has no finished build for this fingerprint" and "nobody could ask" are different facts, and
 * only the first is an answer. `impact` folds them together on purpose — it is *decorating* a
 * report that is complete without them — but `@expo/agent-cli status` reports the difference, because the
 * reader of a status line has to know whether a missing build was established or merely assumed.
 */
export type BuildLookupOutcome =
  | { state: 'found'; build: CachedBuild }
  | { state: 'none' }
  | { state: 'unknown'; reason: string };

/** How much of another CLI's failure fits in a `reason`. */
const REASON_MAX_LENGTH = 160;

/**
 * Look for a finished EAS build made from this exact fingerprint.
 *
 * **Never throws and never fails a command.** No EAS CLI, no account, no network, a project that
 * is not linked to EAS, a payload in a shape this CLI does not recognise — every one of them is an
 * `unknown` with the reason attached, and the caller decides what a section that could not be read
 * is worth.
 */
export async function lookUpCachedBuildAsync(
  easCli: EasCli | null,
  projectRoot: string,
  platform: 'ios' | 'android',
  hash: string | null,
  { timeoutMs = BUILD_CACHE_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<BuildLookupOutcome> {
  if (!easCli) {
    // Not "no EAS CLI is installed" any more — this CLI runs the published one through a package
    // runner, so the only way to get here is a machine with no `npx` and no `bunx` on PATH at all
    // (`src/utils/easCli.ts`).
    return {
      state: 'unknown',
      reason:
        'no package runner ("npx" or "bunx") is on PATH, so nothing here could start the EAS CLI to ask about builds',
    };
  }
  if (!hash) {
    return { state: 'unknown', reason: 'there is no fingerprint to ask about' };
  }

  const result = await spawnSubprocessAsync(
    easCli.command,
    easCliArgs(easCli, buildCacheArgs(platform, hash)),
    {
      cwd: projectRoot,
      output: 'capture',
      timeoutMs,
    }
  );
  if (result.spawnError) {
    return {
      state: 'unknown',
      reason: `the EAS CLI could not be run ("${easCliLabel(easCli)}": ${result.spawnError.message})`,
    };
  }
  if (result.timedOut) {
    return {
      state: 'unknown',
      reason: `the lookup did not answer within ${timeoutMs}ms${runnerDownloadNote(easCli)}`,
    };
  }
  if (result.exitCode !== 0) {
    // @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — what answered the spawn is
    // whatever this machine has under the name `eas`, and a wrapper's panic reported here reads as
    // EAS's answer about this account's builds. The guard is conservative (`wrapperCrash.ts`): both
    // "nothing an EAS run would print" and "died the way a wrapper dies" must hold, so a real
    // refusal keeps its own words.
    if (looksLikeWrapperCrash({ tool: 'eas', ...result })) {
      return {
        state: 'unknown',
        reason: runnerCrashReason({ tool: 'eas', exitCode: result.exitCode }, easCliLabel(easCli)),
      };
    }
    return {
      state: 'unknown',
      reason: describeLookupFailure(result, easCliLabel(easCli)),
    };
  }
  return readLookupPayload(result.stdout);
}

/**
 * The argv that asks EAS what one build is.
 *
 * `eas build:view <id> --json --non-interactive` [inferred — eas-cli documents `build:view` as the
 * command that shows one build, and `--json` implies `--non-interactive` on its siblings; **not yet
 * run against the published binary**, llp/0002 §A flag is not shipped until it has run against the published binary].
 * Every caller treats a failure as "not established", so a spelling this CLI got
 * wrong costs the platform attribution and never the report.
 */
export function buildViewArgs(buildId: string): string[] {
  return ['build:view', buildId, '--json', '--non-interactive'];
}

/**
 * Which platform an EAS build was made for, or null when nothing established it.
 *
 * The fact `status --explain --build <id>` was missing. A build is made for exactly one platform,
 * and the comparison against it was being copied onto **both** — so an iOS
 * development-simulator build was reported as able to run android code [observed — live staging,
 * 2026-08-26, S1].
 *
 * **Never throws and never fails a command.** No EAS CLI, no account, a build id that is not
 * this account's, a payload in a shape this version cannot read: all null, and the caller says the
 * platform was not established rather than guessing one.
 *
 * @ref llp/0021-honest-reports.rfc.md §The rules
 */
export async function lookUpBuildPlatformAsync(
  easCli: EasCli | null,
  projectRoot: string,
  buildId: string,
  { timeoutMs = BUILD_CACHE_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<'ios' | 'android' | null> {
  if (!easCli) {
    return null;
  }
  const result = await spawnSubprocessAsync(
    easCli.command,
    easCliArgs(easCli, buildViewArgs(buildId)),
    {
      cwd: projectRoot,
      output: 'capture',
      timeoutMs,
    }
  );
  if (result.spawnError || result.timedOut || result.exitCode !== 0) {
    return null;
  }
  return parseBuildPlatform(result.stdout);
}

/**
 * Read the platform out of an `eas build:view --json` payload.
 *
 * The payload is one `BuildFragment` object rather than the array `build:list` prints, so both
 * shapes are accepted: a caller that ends up with a list is reading the same field off its first
 * entry. `IOS`/`ANDROID` is how the GraphQL enum spells it, and the field is optional here for the
 * reason every field of another CLI's payload is: a shape that moved must answer null, not throw.
 */
export function parseBuildPlatform(stdout: string): 'ios' | 'android' | null {
  const start = stdout.search(/[[{]/);
  if (start < 0) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.slice(start));
  } catch {
    return null;
  }
  const build = Array.isArray(parsed) ? parsed[0] : parsed;
  if (build == null || typeof build !== 'object') {
    return null;
  }
  const platform = (build as Record<string, unknown>).platform;
  if (typeof platform !== 'string') {
    return null;
  }
  const normalized = platform.toLowerCase();
  return normalized === 'ios' || normalized === 'android' ? normalized : null;
}

/**
 * Why a lookup that ran did not answer, in the words the EAS CLI used.
 *
 * **stdout before stderr**, which is the opposite of the usual order and is what the CLI actually
 * does: an unlinked project gets the whole explanation — `EAS project not configured…`, and the two
 * `eas init` forms that would fix it — on *stdout*, with only `Error: build:list command failed.`
 * on stderr [observed — live against an unlinked project, 2026-08-26]. Reading stderr first would
 * report the one sentence with nothing in it.
 *
 * **And never the runner's own output** (F93). What this returns is printed as what EAS answered
 * about the caller's builds, so a line the *package runner* wrote is the one thing it may not quote:
 * `reason: "Resolving dependencies"` is bun installing, and reads as a sentence about the account
 * that no Expo service ever said [observed — live, 2026-08-27]. `looksLikeRunnerNoise` is the guard,
 * and it says the runner failed to deliver the CLI instead (`src/utils/wrapperCrash.ts`).
 *
 * Exported for the tests that pin both halves.
 *
 * @param invocation how the runner and package spec are written, for the sentence about them.
 */
export function describeLookupFailure(
  result: { exitCode: number | null; stdout: string; stderr: string },
  invocation: string
): string {
  if (looksLikeRunnerNoise({ tool: 'eas', ...result })) {
    return runnerNoiseReason(
      { tool: 'eas', exitCode: result.exitCode },
      invocation,
      runnerNoiseLine(result.stderr)
    );
  }
  const line = firstLine(result.stdout) ?? firstLine(result.stderr);
  if (!line) {
    return 'the EAS CLI refused the lookup and printed nothing';
  }
  return line.length > REASON_MAX_LENGTH ? `${line.slice(0, REASON_MAX_LENGTH).trimEnd()}…` : line;
}

function firstLine(output: string): string | null {
  for (const raw of output.split('\n')) {
    const line = raw.trim();
    if (line) {
      return line;
    }
  }
  return null;
}

/**
 * What a lookup that exited 0 established.
 *
 * An empty list is the service answering "there is no such build", and it is the only output that
 * may be read that way. Output this CLI cannot parse is `unknown`: a shape that moved upstream must
 * never be reported as a fact about an account.
 */
function readLookupPayload(stdout: string): BuildLookupOutcome {
  const start = stdout.indexOf('[');
  if (start < 0) {
    return { state: 'unknown', reason: 'the EAS CLI printed no build list' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.slice(start));
  } catch {
    return {
      state: 'unknown',
      reason: 'the EAS CLI printed a build list this version cannot read',
    };
  }
  if (!Array.isArray(parsed)) {
    return {
      state: 'unknown',
      reason: 'the EAS CLI printed a build list this version cannot read',
    };
  }
  if (parsed.length === 0) {
    return { state: 'none' };
  }

  const build = parseCachedBuild(stdout);
  return build
    ? { state: 'found', build }
    : {
        state: 'unknown',
        reason: 'the EAS CLI listed a build in a shape this version cannot read',
      };
}

/**
 * The one finished build EAS has for this fingerprint, or `null` for every other outcome.
 *
 * The two-state form `impact` reads: it is decorating a report that is complete without a cached
 * build, so "there is none" and "nobody could ask" lead to the same follow-up ladder there. A
 * caller that has to report the difference uses {@link lookUpCachedBuildAsync}.
 */
export async function findCachedBuildAsync(
  easCli: EasCli | null,
  projectRoot: string,
  platform: 'ios' | 'android',
  hash: string | null
): Promise<CachedBuild | null> {
  const outcome = await lookUpCachedBuildAsync(easCli, projectRoot, platform, hash);
  return outcome.state === 'found' ? outcome.build : null;
}

/**
 * Read the first build out of an `eas build:list --json` payload.
 *
 * The command prints an array of `BuildFragment` [observed — eas-cli `build/list.ts` calls
 * `printJsonOnlyOutput` with the list]. Everything is optional here for the reason everything is
 * optional in the deferred `build:wait` parser (llp/0016): this is another CLI's payload across a process boundary, and
 * a field that moved must become `null` rather than throw.
 */
export function parseCachedBuild(stdout: string): CachedBuild | null {
  const start = stdout.indexOf('[');
  if (start < 0) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.slice(start));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return null;
  }

  const build = parsed[0];
  if (build == null || typeof build !== 'object') {
    return null;
  }

  const record = build as Record<string, unknown>;
  const artifacts = record.artifacts as Record<string, unknown> | undefined;
  return {
    id: readString(record.id),
    status: readString(record.status),
    platform: readString(record.platform),
    buildProfile: readString(record.buildProfile),
    createdAt: readString(record.createdAt),
    buildUrl: readString(artifacts?.buildUrl),
  };
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}
