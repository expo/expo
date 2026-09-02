// @ref llp/0023-fingerprint-caching.rfc.md §What a cached hash is revalidated against
// The pinned files a cached fingerprint is checked against on the next run.
//
// A fingerprint costs about a second because it walks the project and `node_modules`. This module is
// the cheap approximation of that walk: the small set of files that, between them, decide almost
// everything the hash is computed from — the lockfiles (which is what `node_modules` is a function
// of), the app config, `eas.json`, `package.json`, and the fingerprint's own settings.
//
// **Each one is pinned by its size and modification time, not by its contents** [decided,
// 2026-08-27, llp/0023 §The key is a stamp, not a hash]. One `stat` per file rather than one read
// plus one sha256, which keeps the revalidation flat in the size of the files: a 295 KB
// `package-lock.json` costs the same as an empty `app.json`.
//
// **It is an approximation, and the approximation is not one-sided.** A `git checkout` moves
// modification times without changing bytes and costs a recomputation — slow, never wrong. The other
// direction exists too: an edit that preserves both size and modification time is invisible here,
// and so is everything under `ios/` and `android/`, which this deliberately does not look at. Those
// are bounded by the record's TTL rather than by this manifest (`FINGERPRINT_CACHE_TTL_MS`), and
// listed in `uncovered` so a report can say so (llp/0021 §The rules).

import fs from 'fs';
import path from 'path';

/**
 * What one manifest entry is, in the words a report uses.
 *
 * Carried through to `--json` and to the printed line rather than spelled there, so the report can
 * never claim a stronger check than the one that ran.
 */
export const FINGERPRINT_KEY_KIND = 'mtime+size';

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
 * Their *stamp* is pinned like anything else, and that is not the same as pinning their *result*: a
 * config that reads `process.env` or another file can return something different from an untouched
 * file. See {@link FingerprintKeyManifest.uncovered}.
 */
const DYNAMIC_APP_CONFIG_NAMES = APP_CONFIG_FILE_NAMES.filter(
  (name) => name !== 'app.json' && name !== 'app.config.json'
);

/**
 * The files stamped at the project root, when they exist.
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
 * The native directories this manifest deliberately does not look at.
 *
 * @ref llp/0023-fingerprint-caching.rfc.md §The native directories are not pinned
 * A prebuilt project's `ios/` and `android/` hold real native sources, and nothing in the sentinel
 * list above moves when one of them is edited. Walking them was measured and cheap; it is skipped
 * anyway [decided, 2026-08-27], which makes the record's TTL the only bound on a native edit
 * going unnoticed. Named here so the manifest can say what it is not covering.
 */
const UNPINNED_NATIVE_DIRECTORIES = ['ios', 'android'];

/**
 * How many files a static config may point at before the manifest gives up on them.
 *
 * `expo-font` can name a lot of files, and stat-ing a font library on every `status` would spend the
 * saving on the saving's own bookkeeping. Over the cap, the assets are reported as uncovered and the
 * cache is refused rather than kept without them.
 *
 * Counted **after** a directory is expanded into its files, which is the number that gets stat-ed:
 * one `ios.icon` bundle is a handful of entries rather than one, and a config naming a dozen of them
 * is what this cap is for.
 */
const MAX_EXTERNAL_FILES = 64;

/** What a cached fingerprint is revalidated against. */
export interface FingerprintKeyManifest {
  /**
   * Pinned file to its stamp — `"<size> <mtimeMs>"` — keyed by its path relative to the project
   * root.
   *
   * A path above the project root keeps its `../` prefix, so the key says where the file was and two
   * projects in one workspace never collide.
   */
  files: Record<string, string>;
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
   * Always non-empty: `node_modules` is only pinned through its lockfile, and `ios/` and `android/`
   * are not pinned at all. A caller that wants no approximation passes `cache: false`.
   */
  uncovered: string[];
}

/**
 * Read the pinned files of a project.
 *
 * Never throws: a file that cannot be stat-ed is left out of the manifest, which makes the next
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
  const configAssets = new Set<string>();
  if (external.truncated) {
    cacheable = false;
    // A count is not claimed, because the walk stops at the cap rather than finishing: saying "the
    // 65 asset files" of a config naming three hundred would be a number this never measured.
    uncovered.push(
      `the asset files this project's config points at, which are more than the ${MAX_EXTERNAL_FILES} this cache will stat on every run`
    );
  } else {
    for (const file of external.paths) {
      candidates.add(file);
      configAssets.add(file);
    }
  }

  const files: Record<string, string> = {};
  // Paths the config *claims* and this could not stamp. See the block below for why only these.
  const unstampable: string[] = [];
  await Promise.all(
    [...candidates].map(async (absolute) => {
      const stamp = await stampFileAsync(absolute);
      if (stamp) {
        files[manifestKey(projectRoot, absolute)] = stamp;
      } else if (configAssets.has(absolute) && (await existsAsync(absolute))) {
        unstampable.push(manifestKey(projectRoot, absolute));
      }
    })
  );

  // @ref llp/0023-fingerprint-caching.rfc.md §What a cached hash is revalidated against
  //
  // The silent-vanish class, closed [F112, wave 27]. A candidate that yields no stamp leaves no
  // entry, and no entry is no mismatch — so whatever is behind it may change while the record still
  // revalidates. That is fine for a **sentinel**, which is a question ("is there an `eas.json`?")
  // whose "no" is itself pinned: one appearing grows the set, and `manifestsMatch` requires the same
  // set. It is not fine for a path the config **points at**, which is a claim that something is
  // there. So the two are told apart, and only the second is reported — and only when the path
  // exists, because a config naming a file that is simply absent is the pinned "no" again.
  if (unstampable.length) {
    uncovered.push(
      `${unstampable.sort().join(', ')} — this project's config points at ${unstampable.length === 1 ? 'it' : 'them'} and nothing there could be stamped, so ${unstampable.length === 1 ? 'its contents are' : 'their contents are'} outside this key and bounded by the cache's expiry alone`
    );
  }

  // Named whether or not this project has them: a managed project can gain them at any time, by way
  // of `expo prebuild`, and this manifest would not notice either the directories or their contents.
  const nativeDirs = UNPINNED_NATIVE_DIRECTORIES.map((name) => `${name}/`).join(' and ');
  uncovered.push(
    `everything in ${nativeDirs}, which this cache does not look at — a native edit, or a prebuild that creates them, is caught by the cache's own expiry and not by these files`
  );

  const dynamicConfig = DYNAMIC_APP_CONFIG_NAMES.filter((name) => files[name] != null);
  if (dynamicConfig.length) {
    uncovered.push(
      `what ${dynamicConfig.join(' and ')} evaluates to — its size and modification time are pinned, and a config that reads environment variables or other files can still answer differently without being touched`
    );
  }

  return { files, cacheable, uncovered };
}

/**
 * Whether two manifests pin exactly the same set of files with exactly the same stamps.
 *
 * A key that gained or lost an entry is a mismatch, not a partial match: a sentinel that appeared
 * (a project that grew an `eas.json`) changes what the fingerprint is of just as much as one whose
 * contents moved.
 */
export function manifestsMatch(a: FingerprintKeyManifest, b: FingerprintKeyManifest): boolean {
  const keys = Object.keys(a.files);
  if (keys.length !== Object.keys(b.files).length) {
    return false;
  }
  return keys.every((key) => a.files[key] === b.files[key]);
}

/** How many files a manifest pins. */
export function manifestSize(manifest: FingerprintKeyManifest): number {
  return Object.keys(manifest.files).length;
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
 *
 * A referenced path may name a directory rather than a file — see {@link expandAssetPathAsync} —
 * so what comes back is files, and the cap counts those.
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
  const paths: string[] = [];
  for (const relative of unique) {
    for (const file of await expandAssetPathAsync(path.resolve(projectRoot, relative))) {
      paths.push(file);
      if (paths.length > MAX_EXTERNAL_FILES) {
        return { paths, truncated: true };
      }
    }
  }
  return { paths, truncated: false };
}

/** How deep an asset bundle is walked before it is treated as too big to be a cache key. */
const MAX_ASSET_DIRECTORY_DEPTH = 4;

/**
 * The files one path in an app config stands for.
 *
 * Usually one image, and since SDK 57 sometimes a **directory**: the default scaffold's `ios.icon`
 * is `./assets/expo.icon`, an icon bundle holding an `icon.json` and an `Assets/` tree.
 * `@expo/fingerprint` hashes what is inside it, and {@link stampFileAsync} answers null for a
 * directory — so such an entry used to disappear out of the manifest with nothing said. No entry is
 * no mismatch, so a file inside the bundle could change while the record still revalidated
 * [observed — 2026-08-28, wave 27: editing `assets/expo.icon/icon.json` moved the real hash from
 * f50891f3 to ed4b0454 while a warm `status` answered f50891f3 from cache for the whole TTL].
 *
 * A path that is neither a file nor a readable directory yields itself, so a config pointing at
 * something that does not exist still pins its *absence* — a file that later appears is a
 * mismatch, which is the direction to be wrong in.
 */
async function expandAssetPathAsync(candidate: string, depth = 0): Promise<string[]> {
  const entries =
    depth < MAX_ASSET_DIRECTORY_DEPTH
      ? await fs.promises.readdir(candidate, { withFileTypes: true }).catch(() => null)
      : null;
  if (!entries) {
    return [candidate];
  }
  const files: string[] = [];
  for (const entry of entries) {
    files.push(...(await expandAssetPathAsync(path.join(candidate, entry.name), depth + 1)));
  }
  return files;
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
 * Every string anywhere in a value, a few levels of nesting deep.
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

/**
 * The stamp of one file — its size and modification time — or null when there is no file there.
 *
 * One `stat`, so a 295 KB lockfile costs what an empty `app.json` costs. Both halves are used
 * because either alone is weaker for no saving: a same-length edit keeps the size, and a filesystem
 * with a coarse timestamp keeps the time.
 */
async function stampFileAsync(file: string): Promise<string | null> {
  const stat = await fs.promises.stat(file).catch(() => null);
  if (!stat || !stat.isFile()) {
    return null;
  }
  return `${stat.size} ${stat.mtimeMs}`;
}

/** The key one pinned file is recorded under: posix-spelled and relative to the project root. */
function manifestKey(projectRoot: string, absolute: string): string {
  return path.relative(projectRoot, absolute).split(path.sep).join('/');
}

function existsAsFile(file: string): boolean {
  return !!fs.statSync(file, { throwIfNoEntry: false })?.isFile();
}

/**
 * Whether anything is at this path — a file, a directory, or something that is neither.
 *
 * `lstat`, so a dangling symlink counts as *present*: the config points at it, and what it points
 * to can be replaced without this key noticing. That is exactly the case worth naming.
 */
async function existsAsync(target: string): Promise<boolean> {
  return await fs.promises.lstat(target).then(
    () => true,
    () => false
  );
}
