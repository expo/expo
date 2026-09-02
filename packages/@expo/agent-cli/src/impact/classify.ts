// @ref llp/0011-impact-and-freshness.rfc.md §The classifier reads `reasons`
// The pure core of `@expo/agent-cli impact`: a fingerprint diff in, a class out. No I/O, no subprocess,
// no network — which is what makes the vocabulary testable exhaustively and what keeps the answer
// the same whether it came from the local CLI or from EAS.

import {
  diffItemSource,
  type FingerprintDiffItem,
  type FingerprintSource,
} from '../project/fingerprint';
import type { ChangedSource, ChangeKind, ImpactClass } from './types';
import { IMPACT_CLASS_ORDER, isStrongerClass } from './types';

/**
 * The `reasons` vocabulary of `@expo/fingerprint`, and what each one costs.
 *
 * Read out of the sourcer, not out of the documentation [observed — `@expo/fingerprint` 0.20.9,
 * `src/sourcer/{Expo,Bare,PatchPackage,Packages}.ts`, 2026-08-24]. Three values that a design
 * document listed as reasons are not: `expoAutolinkingConfig:ios|android` is a source `id`,
 * `rncoreAutolinkingConfig*` is a `contentsId`, and `expoConfigExternalFile:contentsOnly` is an
 * `overrideHashKey`. The sources carrying them have ordinary autolinking reasons, which is why the
 * real diff of an added native module classifies correctly without any of the three.
 *
 * Everything in this table is `needs-native-build`, and that is not a table that lost its nuance:
 * a fingerprint source *is* the native surface, so a source that moved means the binary differs.
 * What varies is the {@link ChangeKind}, which is what decides the follow-up command — a prebuild
 * and a build for an autolinked module, only a new cloud build for an `eas.json` edit.
 */
export const REASON_KINDS: { [reason: string]: ChangeKind } = {
  // A native module entered, left, or changed inside the autolinked surface.
  expoAutolinkingIos: 'native-module',
  expoAutolinkingAndroid: 'native-module',
  rncoreAutolinking: 'native-module',
  rncoreAutolinkingIos: 'native-module',
  rncoreAutolinkingAndroid: 'native-module',
  // A checked-in native project, or the ignore file that decides what of it is hashed.
  bareNativeDir: 'native-project',
  bareGitIgnore: 'native-project',
  // Something that writes native code at prebuild time.
  expoConfigPlugins: 'config-plugin',
  expoCNGPatches: 'config-plugin',
  patchPackage: 'config-plugin',
  // The app config itself, or a file it points at (an icon, a `google-services.json`).
  expoConfig: 'app-config',
  expoConfigExternalFile: 'app-config',
  // How the cloud build is configured: `eas.json` and `.easignore`.
  easBuild: 'build-config',
  // `package.json` `scripts`, which EAS Build runs around the build.
  'packageJson:scripts': 'build-scripts',
};

/**
 * The prefix families, for reasons that carry a value.
 *
 * `package:<name>` is one source per pinned package [observed — `sourcer/Packages.ts`;
 * `package:react-native` is in every real fingerprint], and a `packageJson:scripts` reason is
 * spelled with a colon too. Matching on the prefix is what keeps a new member of either family
 * from falling through to `unknown`.
 */
const REASON_PREFIX_KINDS: { prefix: string; kind: ChangeKind }[] = [
  { prefix: 'package:', kind: 'native-module' },
  { prefix: 'packageJson:', kind: 'build-scripts' },
  { prefix: 'expoAutolinking', kind: 'native-module' },
  { prefix: 'rncoreAutolinking', kind: 'native-module' },
  { prefix: 'expoConfig', kind: 'app-config' },
];

/** What every {@link ChangeKind} costs. */
export const KIND_CLASSES: Record<ChangeKind, ImpactClass> = {
  'native-module': 'needs-native-build',
  'native-project': 'needs-native-build',
  'config-plugin': 'needs-native-build',
  'app-config': 'needs-native-build',
  'build-config': 'needs-native-build',
  'build-scripts': 'needs-native-build',
  // A source this CLI has never heard of still moved the hash, and the hash is the native surface.
  // Reporting it as free would be the one answer a caller cannot recover from; `unknown` is the
  // honest name for it and the class is the conservative one.
  unknown: 'needs-native-build',
};

/**
 * What one `reasons` list means.
 *
 * The strongest reason wins, and where two are equally strong the first exact match does, so a
 * source carrying both `expoAutolinkingIos` and `rncoreAutolinkingIos` (real: a module both
 * autolinkers see) reports one kind rather than two.
 */
export function classifyReasons(reasons: string[]): ChangeKind {
  for (const reason of reasons) {
    const kind = REASON_KINDS[reason];
    if (kind) {
      return kind;
    }
  }
  for (const reason of reasons) {
    const match = REASON_PREFIX_KINDS.find((entry) => reason.startsWith(entry.prefix));
    if (match) {
      return match.kind;
    }
  }
  return 'unknown';
}

/** The identifier of a source, whichever of the four shapes it is. */
export function sourceLabel(source: FingerprintSource): string | null {
  if (typeof source.filePath === 'string' && source.filePath) {
    return source.filePath;
  }
  if (typeof source.id === 'string' && source.id) {
    return source.id;
  }
  if (typeof source.name === 'string' && source.name) {
    return source.version ? `${source.name}@${source.version}` : source.name;
  }
  return null;
}

/** What one diff item is, in this command's terms. */
export function classifyDiffItem(item: FingerprintDiffItem): ChangedSource {
  const source = diffItemSource(item);
  const reasons = Array.isArray(source.reasons) ? source.reasons.filter(isNonEmptyString) : [];
  const kind = classifyReasons(reasons);
  return {
    op: item.op,
    type: typeof source.type === 'string' ? source.type : null,
    path: sourceLabel(source),
    reasons,
    kind,
    class: KIND_CLASSES[kind],
  };
}

/** The result of classifying a whole diff. */
export interface DiffClassification {
  /** The strongest class any item contributed, or `js-only` for an empty diff. */
  class: ImpactClass;
  changedSources: ChangedSource[];
  /** One sentence per distinct kind found, strongest first. */
  reasons: string[];
}

/**
 * Classify a whole fingerprint diff.
 *
 * **The strongest class wins.** A diff holding one autolinked module and forty config-file edits
 * needs a native build, and reporting the majority answer would report the cheap one.
 *
 * An empty diff is `js-only` here, and that is not the final answer: the fingerprint did not move,
 * so whatever changed is outside the native surface, and {@link classifyChangedFiles} is what
 * splits "Fast Refresh picks it up" from "restart Metro".
 */
export function classifyFingerprintDiff(items: FingerprintDiffItem[]): DiffClassification {
  const changedSources = items.map(classifyDiffItem);

  let impactClass: ImpactClass = IMPACT_CLASS_ORDER[0]!;
  for (const source of changedSources) {
    if (isStrongerClass(source.class, impactClass)) {
      impactClass = source.class;
    }
  }

  return { class: impactClass, changedSources, reasons: describeChanges(changedSources) };
}

/** One sentence per kind, naming what carried it. */
function describeChanges(sources: ChangedSource[]): string[] {
  const byKind = new Map<ChangeKind, ChangedSource[]>();
  for (const source of sources) {
    const existing = byKind.get(source.kind);
    if (existing) {
      existing.push(source);
    } else {
      byKind.set(source.kind, [source]);
    }
  }

  const ordered = [...byKind.entries()].sort(
    (a, b) =>
      IMPACT_CLASS_ORDER.indexOf(KIND_CLASSES[b[0]]) -
      IMPACT_CLASS_ORDER.indexOf(KIND_CLASSES[a[0]])
  );
  return ordered.map(([kind, entries]) => describeKind(kind, entries));
}

/** How many names to list before a sentence stops being readable. */
const MAX_NAMED = 3;

function describeKind(kind: ChangeKind, sources: ChangedSource[]): string {
  const names = sources.map((source) => source.path).filter(isNonEmptyString);
  const named = names.slice(0, MAX_NAMED).join(', ');
  const rest = names.length > MAX_NAMED ? ` and ${names.length - MAX_NAMED} more` : '';
  const list = named ? ` (${named}${rest})` : '';
  const count = sources.length === 1 ? 'one source' : `${sources.length} sources`;

  switch (kind) {
    case 'native-module':
      return `the autolinked native modules changed${list}, so the app binary no longer contains what the JavaScript expects`;
    case 'native-project':
      return `the checked-in native project changed${list}, so it has to be compiled again`;
    case 'config-plugin':
      return `a config plugin or native patch changed${list}, so prebuild writes different native code`;
    case 'app-config':
      return `the app config changed${list} in a way that reaches the native project`;
    case 'build-config':
      return `the build configuration changed${list}; this moves the fingerprint without changing generated native code, so a cloud build is enough and prebuild is not needed`;
    case 'build-scripts':
      return `the package.json scripts changed${list}, which EAS Build runs around the build; no native code changed`;
    case 'unknown':
      return `${count} of the native fingerprint changed that this CLI has no name for${list}; treated as needing a build, which is the conservative reading`;
  }
}

/**
 * Files that are outside the Metro graph, so a change to them needs Metro restarted.
 *
 * These are the ones a running dev server read *once*, at start-up: its own configuration, the
 * transform's, and the environment. Fast Refresh cannot pick up a change to how the bundle is
 * built, because the bundle is what Fast Refresh works through.
 */
const DEV_CLIENT_COMPATIBLE_PATTERNS: RegExp[] = [
  /(^|\/)metro\.config\.(js|cjs|mjs|ts)$/,
  /(^|\/)babel\.config\.(js|cjs|mjs|ts)$/,
  /(^|\/)\.babelrc(\.[a-z]+)?$/,
  /(^|\/)\.env(\..+)?$/,
  /(^|\/)tsconfig(\..+)?\.json$/,
  /(^|\/)package\.json$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)bun\.lock(b)?$/,
];

/** Files that are the app config, counted separately in the report. */
const CONFIG_PATTERNS: RegExp[] = [
  /(^|\/)app\.config\.(js|cjs|mjs|ts)$/,
  /(^|\/)app\.json$/,
  /(^|\/)eas\.json$/,
  /(^|\/)\.easignore$/,
];

/** Files inside a native project directory. */
const NATIVE_PATTERNS: RegExp[] = [/^(ios|android)\//, /(^|\/)(ios|android)\//];

/** The file-level answer for a change the fingerprint did not see. */
export interface FileClassification {
  class: ImpactClass;
  counts: { total: number; native: number; js: number; config: number };
  reasons: string[];
}

/**
 * Classify a list of changed paths, for the case where the fingerprint did not move.
 *
 * The fingerprint has already said the native surface is unchanged, so nothing here can reach
 * `needs-native-build` — a file under `ios/` that the fingerprint did not react to is one the
 * preset ignores, and saying otherwise would contradict the stronger evidence. The split this
 * makes is the one the fingerprint cannot: a file the running dev server read *once* means Metro
 * has to be restarted, and everything else is picked up by Fast Refresh.
 */
export function classifyChangedFiles(paths: string[]): FileClassification {
  const normalized = paths.map((value) => value.replace(/\\/g, '/')).filter(isNonEmptyString);
  const restarts = normalized.filter((file) =>
    DEV_CLIENT_COMPATIBLE_PATTERNS.some((pattern) => pattern.test(file))
  );
  const config = normalized.filter((file) => CONFIG_PATTERNS.some((pattern) => pattern.test(file)));
  const native = normalized.filter((file) => NATIVE_PATTERNS.some((pattern) => pattern.test(file)));

  const impactClass: ImpactClass = restarts.length ? 'dev-client-compatible' : 'js-only';
  const reasons: string[] = [];
  if (restarts.length) {
    const named = restarts.slice(0, MAX_NAMED).join(', ');
    const rest = restarts.length > MAX_NAMED ? ` and ${restarts.length - MAX_NAMED} more` : '';
    reasons.push(
      `${named}${rest} is read once when the dev server starts, so Metro has to be restarted for the change to take effect; the installed app itself is still the right one`
    );
  } else if (normalized.length) {
    reasons.push(
      `the native fingerprint is unchanged and every changed file is inside the JavaScript bundle, so Fast Refresh picks this up with nothing restarted`
    );
  }

  return {
    class: impactClass,
    counts: {
      total: normalized.length,
      native: native.length,
      config: config.length,
      // Everything that is not a native file and not a config file. The three do not partition —
      // a `package.json` is counted as JavaScript and as a restart trigger — so `js` is defined by
      // subtraction rather than by a pattern nobody could keep complete.
      js: normalized.filter(
        (file) =>
          !NATIVE_PATTERNS.some((pattern) => pattern.test(file)) &&
          !CONFIG_PATTERNS.some((pattern) => pattern.test(file))
      ).length,
    },
    reasons,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
