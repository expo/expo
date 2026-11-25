import fs from 'fs-extra';
import { createHash } from 'node:crypto';
import { glob, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import semver from 'semver';

import { EXPO_DIR } from '../Constants';
import { runTurboTasksAsync } from '../Turbo';
import { spawnAsync } from '../Utils';
import { getCanaryBumpType } from './Canary';
import { getReleasePublishEnv, runChangesetsAsync, type PublishPlanEntry } from './Changesets';
import { updateVersionDerivedFilesAsync } from './Versioning';

type DependencyMap = Record<string, string>;
type Dependencies = { dependencies?: DependencyMap; optionalDependencies?: DependencyMap };
export type WorkspaceManifest = Dependencies & {
  name: string;
  version: string;
  path: string;
  private?: boolean;
  peerDependencies?: DependencyMap;
  devDependencies?: DependencyMap;
};
type PreviewPlanEntry = PublishPlanEntry & { tag?: string };
type PublishedManifest = Dependencies & {
  name: string;
  version: string;
  dist: { integrity: string };
};

export async function readWorkspaceManifestsAsync(root: string): Promise<WorkspaceManifest[]> {
  const files = await Array.fromAsync(
    glob(['packages/*/package.json', 'packages/@expo/*/package.json'], { cwd: root })
  );
  return Promise.all(
    files.map(async (file) => {
      const absolute = path.resolve(root, file);
      return { ...(await fs.readJson(absolute)), path: path.dirname(absolute) };
    })
  );
}

function runtimeDependencies(manifest: Dependencies): DependencyMap {
  return { ...manifest.dependencies, ...manifest.optionalDependencies };
}

// Built members contribute their checkout dependencies. A member taken from npm brings its own
// published dependencies, which the consumer's package manager resolves.
export function resolvePreviewMembers(
  rootName: string,
  manifests: WorkspaceManifest[],
  build: string[]
): { built: string[]; published: string[] } {
  const byName = new Map(manifests.map((manifest) => [manifest.name, manifest]));
  const root = byName.get(rootName);
  if (!root) throw new Error(`Cannot preview ${rootName}: it is not a workspace package.`);
  if (root.private) throw new Error(`Cannot preview ${rootName}: the package is private.`);

  const selected = new Set(build);
  const built = new Set<string>();
  const published = new Set<string>();
  const queue = [root];
  while (queue.length) {
    const manifest = queue.pop()!;
    if (built.has(manifest.name)) continue;
    built.add(manifest.name);
    for (const name of Object.keys(runtimeDependencies(manifest))) {
      const dependency = byName.get(name);
      if (!dependency) continue;
      if (dependency.private) {
        throw new Error(
          `Cannot preview ${rootName}: ${manifest.name} depends on ${name}, which is private.`
        );
      }
      if (selected.has(name)) queue.push(dependency);
      else published.add(name);
    }
  }
  for (const name of selected) {
    if (!built.has(name)) {
      throw new Error(
        `Cannot build ${name}: ${name} is not a runtime dependency of a built ${rootName} preview member.`
      );
    }
  }
  return {
    built: [...built].sort(),
    published: [...published].filter((name) => !built.has(name)).sort(),
  };
}

export function parsePublishedSelections(values: string[]): Map<string, string> {
  const selections = new Map<string, string>();
  for (const value of values) {
    const at = value.lastIndexOf('@');
    const name = value.slice(0, at);
    const version = value.slice(at + 1);
    if (at <= 0 || semver.valid(version) !== version) {
      throw new Error(`Expected <name>@<exact version>, got "${value}".`);
    }
    if (selections.has(name)) throw new Error(`${name} is selected more than once.`);
    selections.set(name, version);
  }
  return selections;
}

// Returns an exact version or the SDK's range for each package taken from npm.
export function getPublishedSpecs(
  published: string[],
  use: Map<string, string>,
  sdkRanges: DependencyMap,
  expoVersion: string
): Map<string, string> {
  for (const name of use.keys()) {
    if (!published.includes(name)) {
      throw new Error(`Cannot use ${name}: ${name} is not a dependency taken from npm.`);
    }
  }
  return new Map(
    published.map((name) => {
      const spec = use.get(name) ?? sdkRanges[name];
      if (!spec) {
        throw new Error(
          `expo ${expoVersion} does not list ${name}. Pass --build ${name} to preview it, or --use ${name}@<version> to select a published version.`
        );
      }
      return [name, spec];
    })
  );
}

export function resolveExactVersion(name: string, spec: string, versions: string[]): string {
  // `maxSatisfying` skips prereleases for a range, so an SDK range resolves to a stable release.
  const version = semver.valid(spec)
    ? versions.find((candidate) => candidate === spec)
    : semver.maxSatisfying(versions, spec);
  if (!version) throw new Error(`${name}@${spec} is not published.`);
  return version;
}

// Two copies of one native module break the app, so a published member must accept the versions
// the preview selects.
export function findDependencyConflicts(
  published: (Dependencies & { name: string; version: string })[],
  versions: Map<string, string>
): string[] {
  return published.flatMap((manifest) =>
    Object.entries(runtimeDependencies(manifest)).flatMap(([name, range]) => {
      const version = versions.get(name);
      if (!version || semver.satisfies(version, range)) return [];
      return [
        `${manifest.name}@${manifest.version} depends on ${name}@${range}, which excludes ${version}`,
      ];
    })
  );
}

function slug(packageName: string): string {
  return packageName.replace(/^@/, '').replace(/[^a-zA-Z0-9]+/g, '-');
}

// Prerelease identifiers compare as ASCII. `alpha` sorts before `canary`, so a full canary's
// `~X.Y.Z-canary-…` range never selects a preview on the same base version. The commit and the
// selection fix the identity, so a retry reuses the same versions.
export function getPreviewPrerelease(
  rootName: string,
  commit: string,
  selection: Record<string, string>
): string {
  const hash = createHash('sha256')
    .update(JSON.stringify(Object.entries(selection).sort()))
    .digest('hex');
  return `alpha-${slug(rootName)}-${commit.slice(0, 12)}-${hash.slice(0, 8)}`;
}

export function getPreviewDistTag(rootName: string, branchName: string): string {
  const base = `preview-${slug(rootName)}`;
  return branchName === 'main' ? base : `${base}-${slug(branchName)}`;
}

// Pins members exactly, because a range on a preview would let npm pick a newer full canary. Without the
// `precompile-android` script, `expo-module prepack` packs native source instead of a Maven
// repository built against the checkout's React Native.
export function createPreviewManifest<
  T extends Dependencies & { version: string; scripts?: DependencyMap },
>(packageJson: T, version: string, pins: Map<string, string>): T {
  const pin = (dependencies?: DependencyMap) =>
    dependencies &&
    Object.fromEntries(
      Object.entries(dependencies).map(([name, range]) => [name, pins.get(name) ?? range])
    );
  const { 'precompile-android': _, ...scripts } = packageJson.scripts ?? {};
  return {
    ...packageJson,
    version,
    ...(packageJson.scripts && { scripts }),
    ...(packageJson.dependencies && { dependencies: pin(packageJson.dependencies) }),
    ...(packageJson.optionalDependencies && {
      optionalDependencies: pin(packageJson.optionalDependencies),
    }),
  };
}

export function assertPreviewable(manifest: WorkspaceManifest): void {
  // pnpm packs a `workspace:` peer as the checkout's range, not one the target SDK satisfies.
  const peer = Object.entries(manifest.peerDependencies ?? {}).find(([, range]) =>
    range.startsWith('workspace:')
  );
  const reason =
    manifest.name === 'expo-modules-core'
      ? 'ships prebuilt Android native libraries'
      : readSpmConfig(manifest.path)?.publishPrebuilds === true
        ? 'publishes iOS prebuilds'
        : peer
          ? `has the workspace peer dependency ${peer[0]}@${peer[1]}`
          : null;
  if (reason) {
    throw new Error(
      `Cannot preview ${manifest.name}: ${manifest.name} ${reason}. Take ${manifest.name} from npm with --use.`
    );
  }
}

function readSpmConfig(packagePath: string): { publishPrebuilds?: boolean } | null {
  const file = path.join(packagePath, 'spm.config.json');
  return fs.existsSync(file) ? fs.readJsonSync(file) : null;
}

// The Changesets publish plan lists every public workspace package whose version is missing from
// the registry, and it gives each entry the `latest` tag.
export function filterPreviewPublishPlan(
  plan: PreviewPlanEntry[][],
  versions: Map<string, string>,
  tag: string
): { plan: PreviewPlanEntry[][]; published: string[] } {
  const filtered = plan
    .map((chunk) =>
      chunk
        .filter((entry) => versions.has(entry.name))
        .map((entry) => {
          if (entry.kind !== 'publish') {
            throw new Error(`Preview plan has a tag-only entry for ${entry.name}.`);
          }
          if (entry.version !== versions.get(entry.name)) {
            throw new Error(`Preview plan has ${entry.name}@${entry.version}, not the preview.`);
          }
          return { ...entry, tag };
        })
    )
    .filter((chunk) => chunk.length > 0);
  const planned = new Set(filtered.flat().map((entry) => entry.name));
  // A retry with the same identity finds the members an earlier attempt published.
  const published = [...versions.keys()].filter((name) => !planned.has(name)).sort();
  return { plan: filtered, published };
}

const PRECOMPILED_PATHS = /^package\/(local-maven-repo|prebuilds|android\/prebuilt)\//m;

// Checks the real tarballs, because they are what Changesets publishes.
export async function assertPackedPreviewAsync(
  packDir: string,
  versions: Map<string, string>,
  publishing: string[],
  tag: string
): Promise<void> {
  const { plan } = await fs.readJson(path.join(packDir, 'publish-plan.json'));
  const entries: (PreviewPlanEntry & { tarball: { path: string; integrity: string } })[] =
    plan.flat();
  const problems: string[] = [];
  for (const name of publishing) {
    if (!entries.some((entry) => entry.name === name))
      problems.push(`expected ${name} in the pack`);
  }
  for (const entry of entries) {
    if (!publishing.includes(entry.name) || versions.get(entry.name) !== entry.version) {
      problems.push(`${entry.name}@${entry.version} is not part of the preview`);
    }
    if (entry.tag !== tag) problems.push(`${entry.name} has tag ${entry.tag}`);
    const tarball = path.join(packDir, entry.tarball.path);
    const digest = createHash('sha256')
      .update(await fs.readFile(tarball))
      .digest('base64');
    if (entry.tarball.integrity !== `sha256-${digest}`) {
      problems.push(`${entry.name} tarball digest does not match the packed plan`);
    }
    const { stdout: files } = await spawnAsync('tar', ['-tzf', tarball]);
    if (PRECOMPILED_PATHS.test(files)) {
      problems.push(`${entry.name} contains precompiled native output`);
    }
    const { stdout } = await spawnAsync('tar', ['-xOzf', tarball, 'package/package.json']);
    const packed = JSON.parse(stdout);
    if (packed.name !== entry.name) problems.push(`${entry.name} tarball has name ${packed.name}`);
    if (packed.version !== entry.version) {
      problems.push(`${entry.name} tarball has version ${packed.version}`);
    }
    for (const [name, range] of Object.entries<string>(runtimeDependencies(packed))) {
      if (range.startsWith('workspace:')) problems.push(`${entry.name} keeps ${name}@${range}`);
      if (versions.has(name) && range !== versions.get(name)) {
        problems.push(`${entry.name} depends on ${name}@${range}, not ${versions.get(name)}`);
      }
    }
  }
  if (problems.length) throw new Error(`Packed preview is invalid:\n- ${problems.join('\n- ')}`);
}

async function npmViewAsync<T>(spec: string, field?: string): Promise<T> {
  const { stdout } = await spawnAsync('npm', ['view', spec, ...(field ? [field] : []), '--json']);
  return JSON.parse(stdout);
}

// The newest stable Expo release of the SDK and the native module ranges it installs.
async function resolveSdkAsync(sdk: number): Promise<{ expo: string; ranges: DependencyMap }> {
  const expo = resolveExactVersion('expo', `^${sdk}.0.0`, await npmViewAsync('expo', 'versions'));
  const directory = await mkdtemp(path.join(os.tmpdir(), 'expo-preview-sdk-'));
  try {
    const { stdout } = await spawnAsync('npm', ['pack', `expo@${expo}`, '--json'], {
      cwd: directory,
    });
    const [{ filename }] = JSON.parse(stdout);
    const { stdout: bundled } = await spawnAsync(
      'tar',
      ['-xOzf', filename, 'package/bundledNativeModules.json'],
      { cwd: directory }
    );
    return { expo, ranges: JSON.parse(bundled) };
  } finally {
    await fs.remove(directory);
  }
}

type PreviewOptions = {
  rootName: string;
  sdk: number;
  build: string[];
  use: string[];
  branchName: string;
  dryRun: boolean;
  // Keeps the packed tarballs and the selection report. Defaults to a temporary directory.
  packDir?: string;
};

export async function runPackagePreviewAsync(options: PreviewOptions): Promise<void> {
  const manifests = await readWorkspaceManifestsAsync(EXPO_DIR);
  const byName = new Map(manifests.map((manifest) => [manifest.name, manifest]));
  const { built, published } = resolvePreviewMembers(options.rootName, manifests, options.build);
  for (const name of built) assertPreviewable(byName.get(name)!);

  const sdk = await resolveSdkAsync(options.sdk);
  const specs = getPublishedSpecs(
    published,
    parsePublishedSelections(options.use),
    sdk.ranges,
    sdk.expo
  );
  const sources: PublishedManifest[] = [];
  for (const [name, spec] of specs) {
    const version = resolveExactVersion(name, spec, await npmViewAsync(name, 'versions'));
    sources.push(await npmViewAsync(`${name}@${version}`));
  }

  const { stdout: commit } = await spawnAsync('git', ['rev-parse', 'HEAD']);
  // The Expo release only picks default versions, so it stays out of the identity. Replaying the
  // printed `--use` list reproduces the same versions after a newer SDK patch.
  const selection = Object.fromEntries([
    ...built.map((name) => [name, 'build']),
    ...sources.map((source) => [source.name, `${source.version} ${source.dist.integrity}`]),
  ]);
  const prerelease = getPreviewPrerelease(options.rootName, commit.trim(), selection);
  const checkoutSdk = semver.major(byName.get('expo')!.version);
  const versions = new Map([
    ...built.map((name): [string, string] => {
      const current = byName.get(name)!.version;
      const bump = getCanaryBumpType(current, checkoutSdk, options.branchName);
      return [name, `${semver.inc(semver.coerce(current)!, bump)}-${prerelease}`];
    }),
    ...sources.map((source): [string, string] => [source.name, source.version]),
  ]);
  const conflicts = findDependencyConflicts(sources, versions);
  if (conflicts.length) {
    throw new Error(
      `The preview would install two copies of a package:\n- ${conflicts.join('\n- ')}\nPass --build or --use to select compatible versions.`
    );
  }

  const tag = getPreviewDistTag(options.rootName, options.branchName);
  const packDir = options.packDir ?? (await mkdtemp(path.join(os.tmpdir(), 'expo-preview-')));
  await fs.ensureDir(packDir);
  const report = {
    root: options.rootName,
    sdk: sdk.expo,
    commit: commit.trim(),
    tag,
    members: [
      ...built.map((name) => ({ name, version: versions.get(name), source: 'build' })),
      ...sources.map((source) => ({
        name: source.name,
        version: source.version,
        source: 'npm',
        integrity: source.dist.integrity,
      })),
    ],
    replay: {
      build: built.filter((name) => name !== options.rootName).join(','),
      use: sources.map((source) => `${source.name}@${source.version}`).join(','),
    },
    // Other SDK packages, such as `expo-updates`, can depend on a member with a range that the
    // preview does not satisfy. Overrides keep one copy of each member.
    overrides: Object.fromEntries(
      [...versions].filter(([name]) => name !== options.rootName).sort()
    ),
  };
  await fs.writeJson(path.join(packDir, 'preview-selection.json'), report, { spaces: 2 });
  console.log(JSON.stringify(report, null, 2));

  const builtManifests = built.map((name) => byName.get(name)!);
  const restores: (() => Promise<void>)[] = [];
  try {
    // Turbo builds the prerequisites. Then each member compiles again, uncached, against the
    // published packages it will depend on. The checkout's `workspace:` ranges keep Turbo's graph
    // and the lockfile valid until versioning. Exact filters, because `root...` also follows dev
    // dependencies such as `expo`.
    await runTurboTasksAsync(['build'], { filters: built });
    await linkPublishedSourcesAsync(builtManifests, sources, packDir, restores);
    for (const manifest of builtManifests) {
      await spawnAsync('pnpm', ['run', '--if-present', 'build'], {
        cwd: manifest.path,
        stdio: 'inherit',
      });
    }

    // `workspace:*` packs as the exact preview version and keeps the edge that orders the
    // Changesets publish plan, so a member never goes out before a member it depends on.
    const pins = new Map([
      ...built.map((name): [string, string] => [name, 'workspace:*']),
      ...sources.map((source): [string, string] => [source.name, source.version]),
    ]);
    for (const manifest of builtManifests) {
      const file = path.join(manifest.path, 'package.json');
      const preview = createPreviewManifest(
        await fs.readJson(file),
        versions.get(manifest.name)!,
        pins
      );
      await fs.writeJson(file, preview, { spaces: 2 });
    }
    await updateVersionDerivedFilesAsync(
      builtManifests.map((manifest) => ({
        name: manifest.name,
        path: manifest.path,
        after: versions.get(manifest.name)!,
      })),
      true
    );

    const planFile = path.join(packDir, 'preview-plan.json');
    await runChangesetsAsync(['publish-plan', '--output', planFile]);
    const filtered = filterPreviewPublishPlan(
      (await fs.readJson(planFile)).plan,
      new Map(built.map((name) => [name, versions.get(name)!])),
      tag
    );
    if (filtered.published.length) {
      console.log(`Already published by an earlier attempt: ${filtered.published.join(', ')}`);
    }
    if (!filtered.plan.length) return;
    await fs.writeJson(planFile, { version: 1, plan: filtered.plan });
    await runChangesetsAsync(['pack', '--from-publish-plan', planFile, '--out-dir', packDir]);
    const publishing = filtered.plan.flat().map((entry) => entry.name);
    await assertPackedPreviewAsync(packDir, versions, publishing, tag);

    if (!options.dryRun) {
      // Changesets rejects `--tag` with `--from-pack-dir`. The packed plan carries the tag instead.
      await runChangesetsAsync(
        ['publish', '--from-pack-dir', packDir, '--no-git-tag'],
        spawnAsync,
        getReleasePublishEnv()
      );
    }
  } finally {
    // The command starts from a clean tree, so restoring `packages` only undoes this preview.
    try {
      for (const restore of restores.reverse()) await restore();
    } finally {
      await spawnAsync('git', ['checkout', '--', 'packages']);
    }
  }
}

// Replaces each built member's link to the checkout copy of a published dependency with the
// verified npm tarball. A real directory, not a link, so its own imports still resolve through the
// workspace.
async function linkPublishedSourcesAsync(
  members: WorkspaceManifest[],
  sources: PublishedManifest[],
  packDir: string,
  // Filled as links change, so a failure halfway still restores them.
  restores: (() => Promise<void>)[]
): Promise<void> {
  const directory = path.join(packDir, 'sources');
  await fs.emptyDir(directory);
  for (const source of sources) {
    const users = members.filter((member) => runtimeDependencies(member)[source.name]);
    if (!users.length) continue;
    const { stdout } = await spawnAsync(
      'npm',
      ['pack', `${source.name}@${source.version}`, '--json'],
      { cwd: directory }
    );
    const [{ filename, integrity }] = JSON.parse(stdout);
    if (integrity !== source.dist.integrity) {
      throw new Error(`${source.name}@${source.version} does not match its registry integrity.`);
    }
    const extracted = path.join(directory, slug(source.name));
    await fs.ensureDir(extracted);
    await spawnAsync('tar', ['-xzf', path.join(directory, filename), '-C', extracted]);
    for (const member of users) {
      const link = path.join(member.path, 'node_modules', source.name);
      const target = await fs.readlink(link);
      restores.push(async () => {
        await fs.remove(link);
        await fs.symlink(target, link);
      });
      await fs.remove(link);
      await fs.copy(path.join(extracted, 'package'), link);
    }
  }
}
