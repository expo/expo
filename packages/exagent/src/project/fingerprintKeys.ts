// @ref llp/0023-fingerprint-caching.rfc.md §What a cached hash is revalidated against
// The pinned files a cached fingerprint is checked against on the next run.
//
// A fingerprint costs about a second because it walks the project and `node_modules`. This module
// is the cheap approximation of that walk: the small set of files that, between them, decide almost
// everything the hash is computed from. Content-hash them all and the total is a few milliseconds
// — measured against ~1.1 s for one `fingerprint:generate` on a real SDK 57 app.
//
// **It is an approximation, and it is only allowed to be wrong in one direction.** A file that
// changed and is not pinned would make a stale hash look current, so the set is chosen to cover
// every input that can move a hash without also moving one of these — the lockfiles (which is what
// `node_modules` is a function of), the app config, `eas.json`, `package.json`, the fingerprint's
// own settings, and for a bare project the native directories themselves. What it cannot cover is
// listed in `uncovered` and reported rather than hidden (llp/0021 §Honest reports).

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Every lockfile spelling a package manager writes, plus the two files that mark a workspace root.
 *
 * These are the load-bearing entries: `node_modules` is what the fingerprint spends most of its
 * time in, and a lockfile is the one small file that changes whenever its contents do.
 */
export const LOCKFILE_NAMES = [
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'bun.lock',
  'bun.lockb',
  'deno.lock',
];

/**
 * Every app-config spelling `@expo/config` resolves, in its own precedence order.
 *
 * The dynamic forms are the `app.config` extensions of `DYNAMIC_CONFIG_EXTS` [observed —
 * `@expo/config` `src/Config.ts`, 2026-08-27]. All of them are listed rather than only the one this
 * project has, because a project that *gains* one has changed its config, and a set that grew is a
 * cache miss.
 */
export const APP_CONFIG_FILE_NAMES = [
  'app.json',
  'app.config.json',
  'app.config.ts',
  'app.config.mts',
  'app.config.cts',
  'app.config.mjs',
  'app.config.cjs',
  'app.config.js',
];

/**
 * The `app.config.*` forms that are evaluated rather than read.
 *
 * Their *contents* are pinned like anything else, and that is not the same as pinning their
 * *result*: a config that reads `process.env` or another file can return something different from
 * an unchanged file. See {@link FingerprintKeyManifest.uncovered}.
 */
const DYNAMIC_APP_CONFIG_NAMES = APP_CONFIG_FILE_NAMES.filter(
  (name) => name !== 'app.json' && name !== 'app.config.json'
);

/**
 * The files hashed at the project root, when they exist.
 *
 * `fingerprint.config.js` is in here because `@expo/fingerprint` loads it for `preset`,
 * `ignorePaths`, `sourceSkips` and `extraSources` [observed — `@expo/fingerprint` `src/Config.ts`
 * `CONFIG_FILES`]: it decides *what the hash is of*, so a change to it changes the hash without
 * changing any source. `.fingerprintignore` and `.easignore` are here for the same reason, and
 * `.gitignore` because the bare sourcer hashes it directly (`bareGitIgnore`).
 */
export const PROJECT_SENTINEL_FILE_NAMES = [
  ...LOCKFILE_NAMES,
  'package.json',
  ...APP_CONFIG_FILE_NAMES,
  'eas.json',
  '.easignore',
  '.gitignore',
  '.fingerprintignore',
  'fingerprint.config.js',
  'fingerprint.config.cjs',
];

/**
 * The files also looked for *above* the project, for a monorepo.
 *
 * A hoisted install puts the lockfile at the workspace root and nothing at the project root, so a
 * manifest that only looked down would pin no lockfile at all in exactly the repositories where
 * `node_modules` moves most often. The workspace `package.json` rides along with it, because that
 * is where such a repository declares the versions.
 */
export const HOISTED_SENTINEL_FILE_NAMES = [...LOCKFILE_NAMES, 'package.json'];

/** Directory of `patch-package` patches, which the fingerprint hashes one by one. */
const PATCHES_DIRECTORY = 'patches';

/**
 * How many files the manifest will pin before it gives up on being a cache key.
 *
 * A ceiling rather than a truncation: a manifest that silently stopped covering the rest of a
 * directory would be the one failure mode this whole design exists to avoid. Measured against a
 * real prebuilt scaffold, `ios/` and `android/` together hold 70 files [observed — a blank
 * `create-expo-app` prebuilt for both platforms, 2026-08-27], so the budget is two orders of
 * magnitude above the case it is for.
 */
export const MAX_NATIVE_MANIFEST_FILES = 5000;

/**
 * How many files a static config may point at before the manifest gives up on them.
 *
 * `expo-font` can name a lot of files, and hashing a font library on every `status` would spend the
 * saving on the saving's own bookkeeping. Over the cap, the assets are reported as uncovered and
 * the cache is refused rather than kept without them.
 */
const MAX_EXTERNAL_FILES = 64;

/**
 * Directory names skipped inside `ios/` and `android/`.
 *
 * Mirrors `DEFAULT_IGNORE_PATHS` of `@expo/fingerprint` [observed — `src/Options.ts`, 2026-08-27]:
 * these are build outputs and per-machine state, which the fingerprint does not hash either, and
 * `ios/Pods` alone can be tens of thousands of files.
 */
const NATIVE_SKIP_DIRECTORIES = new Set([
  'Pods',
  'build',
  '.gradle',
  '.cxx',
  '.swiftpm',
  'DerivedData',
  'xcuserdata',
  'project.xcworkspace',
  'node_modules',
]);

/** Files skipped inside `ios/` and `android/`, for the same reason as the directories above. */
const NATIVE_SKIP_FILES = new Set(['.DS_Store', 'gradlew.bat', '.xcode.env.local']);

/** What a cached fingerprint is revalidated against on the next run. */
export interface FingerprintKeyManifest {
  /**
   * Pinned file to content hash, keyed by its path relative to the project root.
   *
   * A path above the project root keeps its `../` prefix, so the key says where the file was and
   * two projects in one workspace never collide.
   */
  files: Record<string, string>;
  /**
   * A digest of the stat of everything under `ios/` and `android/`, or null when there is no such
   * directory.
   *
   * Size and modification time rather than content: a prebuilt project's native tree holds binaries
   * and asset catalogues, and a stat walk of it measured 0.7–2.0 ms against ~1.1 s for the
   * fingerprint it stands in for [observed — 2026-08-27]. It is the weaker check of the two, and it
   * is weak in the safe direction: a `git checkout` that restores identical bytes moves the
   * modification time and costs a recomputation, which is a slow answer rather than a wrong one.
   */
  nativeDirs: { ios: string | null; android: string | null };
  /**
   * Whether this manifest may be used as a cache key at all.
   *
   * False when something it would have had to cover was too big to cover cheaply. A manifest that
   * cannot be a key means the cross-run cache is off for this project, not that it is approximate.
   */
  cacheable: boolean;
  /**
   * What this manifest does not pin, in the words a report can print.
   *
   * Always non-empty: `node_modules` is only pinned through its lockfile, and that is a fact about
   * every project. A caller that wants no approximation at all passes `cache: false`.
   */
  uncovered: string[];
}

/**
 * Read the pinned files of a project.
 *
 * Never throws: a file that cannot be read is left out of the manifest, which makes the next
 * comparison differ and costs a recomputation. Nothing here is allowed to fail a command.
 */
export async function buildFingerprintKeyManifestAsync(
  projectRoot: string
): Promise<FingerprintKeyManifest> {
  const uncovered: string[] = [
    `the contents of node_modules, which are pinned only through the lockfile and package.json`,
  ];
  let cacheable = true;

  const candidates = new Set<string>();
  for (const name of PROJECT_SENTINEL_FILE_NAMES) {
    candidates.add(path.join(projectRoot, name));
  }
  for (const ancestor of findAncestorSentinels(projectRoot)) {
    candidates.add(ancestor);
  }
  for (const patch of await listPatchFilesAsync(projectRoot)) {
    candidates.add(patch);
  }

  const external = await readStaticConfigAssetsAsync(projectRoot);
  if (external.truncated) {
    cacheable = false;
    uncovered.push(
      `the ${external.paths.length} asset files this project's config points at, which is more than the ${MAX_EXTERNAL_FILES} this cache will hash on every run`
    );
  } else {
    for (const file of external.paths) {
      candidates.add(file);
    }
  }

  const files: Record<string, string> = {};
  await Promise.all(
    [...candidates].map(async (absolute) => {
      const hash = await hashFileAsync(absolute);
      if (hash) {
        files[manifestKey(projectRoot, absolute)] = hash;
      }
    })
  );

  const nativeDirs: FingerprintKeyManifest['nativeDirs'] = {
    ios: null,
    android: null,
  };
  for (const platform of ['ios', 'android'] as const) {
    const walked = await digestNativeDirAsync(path.join(projectRoot, platform));
    if (walked.tooLarge) {
      cacheable = false;
      uncovered.push(
        `the contents of ${platform}/, which holds more than ${MAX_NATIVE_MANIFEST_FILES} files this cache would have to stat on every run`
      );
      continue;
    }
    nativeDirs[platform] = walked.digest;
  }

  const dynamicConfig = DYNAMIC_APP_CONFIG_NAMES.filter((name) => files[name] != null);
  if (dynamicConfig.length) {
    uncovered.push(
      `what ${dynamicConfig.join(' and ')} evaluates to — its bytes are pinned, and a config that reads environment variables or other files can still answer differently with the same bytes`
    );
  }

  return { files, nativeDirs, cacheable, uncovered };
}

/**
 * Whether two manifests pin exactly the same set of files at exactly the same contents.
 *
 * A key that gained or lost an entry is a mismatch, not a partial match: a sentinel that appeared
 * (a project that grew an `eas.json`) changes what the fingerprint is of just as much as one whose
 * contents moved.
 */
export function manifestsMatch(a: FingerprintKeyManifest, b: FingerprintKeyManifest): boolean {
  if (a.nativeDirs.ios !== b.nativeDirs.ios || a.nativeDirs.android !== b.nativeDirs.android) {
    return false;
  }
  const keys = Object.keys(a.files);
  if (keys.length !== Object.keys(b.files).length) {
    return false;
  }
  return keys.every((key) => a.files[key] === b.files[key]);
}

/** How many files a manifest pins, native directories counted as one each. */
export function manifestSize(manifest: FingerprintKeyManifest): number {
  const dirs = [manifest.nativeDirs.ios, manifest.nativeDirs.android].filter(Boolean).length;
  return Object.keys(manifest.files).length + dirs;
}

/**
 * The sentinels of the directories *above* the project, closest first.
 *
 * Stops at the first ancestor holding each name, because that is the one that applies: a hoisted
 * `pnpm-lock.yaml` at the workspace root is the lockfile of this project, and a second one further
 * up belongs to something else.
 */
function findAncestorSentinels(projectRoot: string): string[] {
  const found: string[] = [];
  for (const name of HOISTED_SENTINEL_FILE_NAMES) {
    for (let dir = path.dirname(projectRoot); path.dirname(dir) !== dir; dir = path.dirname(dir)) {
      const candidate = path.join(dir, name);
      if (existsAsFile(candidate)) {
        found.push(candidate);
        break;
      }
    }
  }
  return found;
}

/** The `patch-package` patches, which the fingerprint hashes one by one (`expoCNGPatches`). */
async function listPatchFilesAsync(projectRoot: string): Promise<string[]> {
  const directory = path.join(projectRoot, PATCHES_DIRECTORY);
  const entries = await fs.promises.readdir(directory).catch(() => null);
  if (!entries) {
    return [];
  }
  return entries.map((entry) => path.join(directory, entry));
}

/**
 * The asset files a *static* config points at.
 *
 * Read statically and never evaluated (llp/0001 §Constraints item 5), so a project with a dynamic
 * config contributes nothing here — which is one of the reasons that project's manifest reports the
 * config itself as uncovered. These are separate sources of the fingerprint
 * (`expoConfigExternalFile`): changing an icon changes the hash while leaving `app.json` alone.
 */
async function readStaticConfigAssetsAsync(
  projectRoot: string
): Promise<{ paths: string[]; truncated: boolean }> {
  const config = await readStaticConfigAsync(projectRoot);
  if (!config) {
    return { paths: [], truncated: false };
  }

  const expo = (config.expo ?? config) as Record<string, any>;
  const ios = (expo.ios ?? {}) as Record<string, any>;
  const android = (expo.android ?? {}) as Record<string, any>;
  const splash = pluginProps(expo, 'expo-splash-screen');
  const font = pluginProps(expo, 'expo-font');

  const referenced = [
    expo.icon,
    ios.icon,
    ...collectStrings(ios.icon),
    android.icon,
    android.googleServicesFile,
    ios.googleServicesFile,
    android.adaptiveIcon?.foregroundImage,
    android.adaptiveIcon?.backgroundImage,
    android.adaptiveIcon?.monochromeImage,
    splash?.image,
    splash?.dark?.image,
    ...collectStrings(splash?.ios),
    ...collectStrings(splash?.android),
    ...collectStrings(font?.fonts),
    ...collectStrings(font?.ios?.fonts),
    ...collectStrings(font?.android?.fonts),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  const unique = [...new Set(referenced)];
  const paths = unique.map((relative) => path.resolve(projectRoot, relative));
  return { paths, truncated: unique.length > MAX_EXTERNAL_FILES };
}

/** The static config object, or null when this project has none (or an unreadable one). */
async function readStaticConfigAsync(projectRoot: string): Promise<Record<string, any> | null> {
  for (const name of ['app.config.json', 'app.json']) {
    const contents = await fs.promises
      .readFile(path.join(projectRoot, name), 'utf8')
      .catch(() => null);
    if (contents == null) {
      continue;
    }
    try {
      const parsed = JSON.parse(contents);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, any>;
      }
    } catch {
      // An unparsable config points at nothing this can read. The file itself is pinned either way.
    }
  }
  return null;
}

/** The props of one config plugin, whichever of the two spellings the config used. */
function pluginProps(expo: Record<string, any>, name: string): Record<string, any> | null {
  const plugins = Array.isArray(expo.plugins) ? expo.plugins : [];
  for (const plugin of plugins) {
    if (Array.isArray(plugin) && plugin[0] === name) {
      return plugin[1] && typeof plugin[1] === 'object' ? (plugin[1] as Record<string, any>) : null;
    }
  }
  return null;
}

/**
 * Every string anywhere in a value, one level of nesting deep.
 *
 * The asset fields of the config plugins are spelled several ways — a string, an array of strings,
 * an object of per-density strings — and a manifest that only read one of them would leave the
 * others unpinned. Collecting the strings covers all of them without a schema.
 */
function collectStrings(value: unknown, depth = 0): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (depth > 3 || value == null || typeof value !== 'object') {
    return [];
  }
  return Object.values(value as Record<string, unknown>).flatMap((nested) =>
    collectStrings(nested, depth + 1)
  );
}

/** The content hash of one file, or null when there is no readable file there. */
async function hashFileAsync(file: string): Promise<string | null> {
  const contents = await fs.promises.readFile(file).catch(() => null);
  if (contents == null) {
    return null;
  }
  return `sha256:${crypto.createHash('sha256').update(contents).digest('hex')}`;
}

/**
 * A digest of the size and modification time of every file under one native directory.
 *
 * `{ digest: null }` for a directory that is not there, which is what a managed project has and
 * what makes `prebuild` a cache miss: the key gains a value where it had none.
 */
async function digestNativeDirAsync(
  directory: string
): Promise<{ digest: string | null; tooLarge: boolean }> {
  const lines: string[] = [];
  const walked = await walkNativeDirAsync(directory, directory, lines);
  if (!walked.exists) {
    return { digest: null, tooLarge: false };
  }
  if (walked.tooLarge) {
    return { digest: null, tooLarge: true };
  }
  lines.sort();
  return {
    digest: `sha256:${crypto.createHash('sha256').update(lines.join('\n')).digest('hex')}`,
    tooLarge: false,
  };
}

async function walkNativeDirAsync(
  root: string,
  directory: string,
  lines: string[]
): Promise<{ exists: boolean; tooLarge: boolean }> {
  const entries = await fs.promises.readdir(directory, { withFileTypes: true }).catch(() => null);
  if (!entries) {
    return { exists: false, tooLarge: false };
  }

  for (const entry of entries) {
    if (lines.length > MAX_NATIVE_MANIFEST_FILES) {
      return { exists: true, tooLarge: true };
    }
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (NATIVE_SKIP_DIRECTORIES.has(entry.name)) {
        continue;
      }
      const nested = await walkNativeDirAsync(root, absolute, lines);
      if (nested.tooLarge) {
        return { exists: true, tooLarge: true };
      }
      continue;
    }
    if (!entry.isFile() || NATIVE_SKIP_FILES.has(entry.name)) {
      continue;
    }
    const stat = await fs.promises.stat(absolute).catch(() => null);
    if (stat) {
      lines.push(`${path.relative(root, absolute)} ${stat.size} ${stat.mtimeMs}`);
    }
  }
  return { exists: true, tooLarge: lines.length > MAX_NATIVE_MANIFEST_FILES };
}

/** The key one pinned file is recorded under: posix-spelled and relative to the project root. */
function manifestKey(projectRoot: string, absolute: string): string {
  return path.relative(projectRoot, absolute).split(path.sep).join('/');
}

function existsAsFile(file: string): boolean {
  return !!fs.statSync(file, { throwIfNoEntry: false })?.isFile();
}
