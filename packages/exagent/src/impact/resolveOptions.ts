// @ref llp/0011-impact-and-freshness.rfc.md §Command surface
// Argument resolution for `exagent impact`. Pure: argv in, options out, `CommandError` for
// anything a caller can get wrong, so every combination is unit-testable without a project.

import { parseArgsOrThrow, strayArgumentError } from '../utils/args';
import { CommandError } from '../utils/errors';
import type { ComparisonKind, ImpactClass } from './types';
import { IMPACT_CLASS_ORDER } from './types';

/** The platform selector, before it is resolved against what the project targets. */
export type PlatformSelection = 'ios' | 'android' | 'all';

/** The fingerprint presets `@expo/fingerprint` accepts [observed — `FingerprintPreset`]. */
export const PRESETS = ['strict', 'balanced', 'relaxed'];

/**
 * The preset `@expo/fingerprint` applies when nobody names one [observed — `Options.preset`].
 *
 * Reported, never *passed*. `--preset` reached the published CLI only after 0.20.9, whose
 * `fingerprint:generate` rejects it outright [observed — 2026-08-24, a real SDK 57 project:
 * `unknown or unexpected option: --preset`], so sending it unasked would break this command
 * against every project installed from the registry today. The flag is forwarded only when the
 * caller named it, and then a CLI too old for it says so.
 */
export const DEFAULT_PRESET = 'balanced';

export interface ImpactOptions {
  platform: PlatformSelection;
  mode: ComparisonKind;
  /** The EAS build to compare against, for `mode: 'eas-build'`. */
  buildId: string | null;
  /** The git ref to compare against, for `mode: 'git-refs'`. */
  base: string | null;
  /** The git ref to compare `base` against, instead of the working tree. */
  head: string | null;
  /** The `eas.json` build profile, so a profile's environment reaches the app config. */
  profile: string | null;
  /**
   * The fingerprint preset to pass through, or `null` when the caller named none.
   *
   * `null` is not `DEFAULT_PRESET`: it is the difference between "compute this under balanced" and
   * "do not send a --preset flag at all", and only the second works on a published CLI older than
   * the flag.
   */
  preset: string | null;
  /** Exit `20` when the real class is stronger than this one. Null without `--assert`. */
  assert: ImpactClass | null;
  json: boolean;
  followups: boolean;
}

const IMPACT_ARGS = {
  '--platform': String,
  '--base': String,
  '--head': String,
  '--build': String,
  '--profile': String,
  '--preset': String,
  '--assert': String,
  '--json': Boolean,
  '--no-followups': Boolean,
};

/**
 * Resolve the arguments of `exagent impact`.
 *
 * @throws {CommandError} `BAD_ARGS` for an unknown flag, an unusable value, or two comparison
 *   modes at once.
 */
export function resolveImpactOptions(argv: string[]): ImpactOptions {
  const args = parseArgsOrThrow(IMPACT_ARGS, argv, 'impact');

  if (args._.length > 0) {
    // `impact` reads no positional arguments. The one a caller is most likely to type is a build
    // id, because `build:wait` takes one there, so the hint names the flag that carries it.
    throw strayArgumentError('impact', args._, {
      hint: `To compare against an EAS build, name it with --build <id>.`,
    });
  }

  const platform = resolvePlatform(args['--platform']);
  const preset = resolvePreset(args['--preset']);
  const assert = resolveAssert(args['--assert']);
  const buildId = nonEmpty(args['--build']);
  const base = nonEmpty(args['--base']);
  const head = nonEmpty(args['--head']);

  if (buildId && base) {
    throw conflictingModes();
  }
  if (head && !base) {
    // `--head` names the *other* side of a `--base` comparison. Alone it would mean "compare this
    // ref against itself", which is a comparison with a known answer and no reason to run.
    throw new CommandError(
      'BAD_ARGS',
      [
        `--head names the far side of a --base comparison, and no --base was given.`,
        `Why: --base <ref> --head <ref> compares two revisions. With no --base there is nothing for --head to be compared against, and the working tree is what the default mode already uses.`,
        `How: pass both, as in "npx exagent impact --base HEAD~1 --head HEAD", or drop --head to compare the working tree against the last recorded build.`,
      ].join('\n')
    );
  }

  const mode: ComparisonKind = buildId ? 'eas-build' : base ? 'git-refs' : 'last-build';

  return {
    platform,
    mode,
    buildId,
    base,
    head,
    profile: nonEmpty(args['--profile']),
    preset,
    assert,
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}

function resolvePlatform(value: unknown): PlatformSelection {
  if (value == null) {
    return 'all';
  }
  if (value === 'ios' || value === 'android' || value === 'all') {
    return value;
  }
  throw new CommandError(
    'BAD_ARGS',
    [
      `--platform ${String(value)} is not a platform this can classify.`,
      `Why: a fingerprint is computed per native platform, and the only two Expo builds native code for are ios and android. "web" has no native surface, so it never needs a build.`,
      `How: pass --platform ios, --platform android, or --platform all (the default).`,
    ].join('\n')
  );
}

function resolvePreset(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string' && PRESETS.includes(value)) {
    return value;
  }
  throw new CommandError(
    'BAD_ARGS',
    [
      `--preset ${String(value)} is not a fingerprint preset.`,
      `Why: the preset decides what counts as part of the native surface, so both sides of a comparison have to use the same one, and it has to be one @expo/fingerprint knows.`,
      `How: pass one of ${PRESETS.join(', ')}. The default is ${DEFAULT_PRESET}.`,
    ].join('\n')
  );
}

function resolveAssert(value: unknown): ImpactClass | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string' && (IMPACT_CLASS_ORDER as string[]).includes(value)) {
    return value as ImpactClass;
  }
  throw new CommandError(
    'BAD_ARGS',
    [
      `--assert ${String(value)} is not one of the classes this reports.`,
      `Why: --assert is a gate on the class in the report, so it has to name one of them: it passes when the real class is at most the one named.`,
      `How: pass one of ${IMPACT_CLASS_ORDER.join(', ')}, weakest first. "--assert js-only" is the strictest gate.`,
    ].join('\n')
  );
}

function conflictingModes(): CommandError {
  const error = new CommandError(
    'BAD_ARGS',
    [
      `--build and --base name two different things to compare against, and only one comparison runs.`,
      `Why: --build compares against the fingerprint EAS computed for a build it made, and --base compares against a revision in this repository. They answer different questions and their bases are not the same object.`,
      `How: run it twice, once with each. To ask whether a cloud build is stale, --build <id> is the one to use: it needs no local record.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent impact --help';
  return error;
}

function nonEmpty(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
