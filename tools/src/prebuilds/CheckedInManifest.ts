import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';

import { getPackagesDir } from '../Directories';
import logger from '../Logger';
import { isExternalPackage, type SPMPackageSource } from './ExternalPackage';
import type { SPMPackageDependencyConfig, SPMProduct, SourceTarget } from './SPMConfig.types';
import { parseLinkedFrameworks } from './SPMIdentifier';
import type { ResolvedTarget } from './SPMPackage.types';

export interface CheckedInResolvedTarget extends ResolvedTarget {
  sourceRoot: string;
  sources: string[];
  exclude: string[];
  productMember: boolean;
}

export function isCheckedInResolvedTarget(
  target: ResolvedTarget
): target is CheckedInResolvedTarget {
  return 'sourceRoot' in target && Array.isArray((target as CheckedInResolvedTarget).sources);
}

type DumpedDependency = {
  byName?: [string, unknown?];
  target?: [string, unknown?];
  product?: [name: string, packageName: string, moduleAliases: unknown, condition: unknown];
};

type DumpedResource = { path: string; rule: Record<string, unknown> };
type DumpedTarget = {
  name: string;
  type: string;
  path?: string;
  exclude?: string[];
  sources?: string[];
  resources?: DumpedResource[];
  publicHeadersPath?: string;
  dependencies?: DumpedDependency[];
  pluginUsages?: { plugin: [string, string | null] }[];
};
type DumpedManifest = {
  name: string;
  defaultLocalization?: string;
  dependencies?: unknown[];
  products?: { name: string; type: Record<string, unknown>; targets?: string[] }[];
  targets?: DumpedTarget[];
};

const SOURCE_EXTENSIONS = /\.(swift|m|mm|c|cc|cpp|cxx|s)$/i;
const CPP_EXTENSIONS = /\.(mm|cc|cpp|cxx)$/i;
const PREDEFINED_SOURCE_DIRS = ['Sources', 'Source', 'src', 'srcs'];

/**
 * Whether `packagePath` is a first-party package directory: one level under the repository
 * `packages/` directory, or two when the first level is an `@scope` directory. Both paths must
 * already be canonical, because the comparison is case-sensitive.
 */
export function isFirstPartyPackagePath(packagesRoot: string, packagePath: string): boolean {
  const relative = path.relative(packagesRoot, packagePath);
  if (relative === '' || path.isAbsolute(relative)) return false;
  const parts = relative.split(path.sep);
  if (parts.some((part) => part === '..' || part === 'node_modules')) return false;
  return parts.length === 1 || (parts.length === 2 && parts[0].startsWith('@'));
}

/** `fs.realpathSync` keeps the casing it is given, so it cannot tell `packages` apart from
 * `PACKAGES`. Its `native` form calls the OS `realpath`, which returns the real on-disk spelling
 * of every component, and containment can then compare case-sensitively on any volume. A path
 * that does not resolve is not a first-party package, so it canonicalizes to null. */
function canonicalize(directory: string, role: string): string | null {
  try {
    return fs.realpathSync.native(directory);
  } catch (error: unknown) {
    const reason =
      (error instanceof Error ? (error as NodeJS.ErrnoException).code : null) ?? String(error);
    logger.debug(
      `Not using a checked-in Package.swift: ${role} ${directory} did not resolve (${reason}). Check that the path exists and is readable.`
    );
    return null;
  }
}

/**
 * The canonical directory of `pkg` when it is a first-party package carrying a checked-in
 * `Package.swift`, and null when it is not. Callers must read the manifest from the returned path:
 * a package path can name one directory lexically and another once its symlinks are resolved, so
 * only reusing this one result keeps the directory that was validated and the directory that is
 * consumed the same directory.
 *
 * The guarantee is scoped to a filesystem that stays unchanged for the duration of the call, which
 * is what a build tool reading a repository checkout can assume.
 */
export function resolveCheckedInManifestRoot(pkg: SPMPackageSource): string | null {
  if (isExternalPackage(pkg)) return null;
  const packagePath = canonicalize(pkg.path, 'the package directory');
  if (packagePath == null) return null;
  if (!fs.existsSync(path.join(packagePath, 'Package.swift'))) return null;
  // Defends the packages root against dependency trees nested inside it, such as
  // packages/expo-camera/node_modules/evil: such a directory really is under the root, and npm
  // always spells it `node_modules`, so an exact comparison on a canonical path answers it. A
  // packages root redirected elsewhere moves the anchor instead, and no spelling comparison here
  // can re-establish an anchor that has been redefined.
  if (packagePath.split(path.sep).includes('node_modules')) return null;
  const packagesRoot = canonicalize(getPackagesDir(), 'the repository packages directory');
  if (packagesRoot == null) return null;
  if (!isFirstPartyPackagePath(packagesRoot, packagePath)) {
    logger.debug(
      `Not using the checked-in Package.swift in ${packagePath}: it is not a package directory under ${packagesRoot}. Check that EXPO_ROOT_DIR names this checkout, and that the package is one directory under ${packagesRoot}, or two under an @scope directory.`
    );
    return null;
  }
  return packagePath;
}

const dumpedManifests = new Map<string, { stamp: string; result: Promise<DumpedManifest> }>();

async function dumpManifest(root: string): Promise<DumpedManifest> {
  root = path.resolve(root);
  const stat = await fs.stat(path.join(root, 'Package.swift'));
  const stamp = `${stat.mtimeMs}:${stat.ctimeMs}:${stat.size}`;
  const cached = dumpedManifests.get(root);
  if (cached?.stamp === stamp) return cached.result;
  const result = (async () => {
    const moduleCache = path.join(os.tmpdir(), 'expo-swiftpm-module-cache');
    await fs.ensureDir(moduleCache);
    const { stdout } = await spawnAsync(
      'swift',
      ['package', '--disable-sandbox', 'dump-package', '--package-path', root],
      {
        cwd: root,
        env: {
          ...process.env,
          CLANG_MODULE_CACHE_PATH: moduleCache,
          SWIFTPM_MODULECACHE_OVERRIDE: moduleCache,
        },
      }
    );
    return JSON.parse(stdout) as DumpedManifest;
  })();
  dumpedManifests.set(root, { stamp, result });
  try {
    return await result;
  } catch (error) {
    if (dumpedManifests.get(root)?.result === result) dumpedManifests.delete(root);
    throw error;
  }
}

function manifestError(product: string, target: string, what: string, how: string): Error {
  return new Error(
    `Cannot use the checked-in Package.swift for product "${product}", target "${target}": ${what} ${how}`
  );
}

function dependencyName(dependency: DumpedDependency): string | null {
  return dependency.byName?.[0] ?? dependency.target?.[0] ?? dependency.product?.[0] ?? null;
}

type ManifestError = (what: string, how: string) => Error;

const PINNED_KINDS = ['exact', 'branch', 'revision'] as const;
type PinnedRequirement = { kind: (typeof PINNED_KINDS)[number]; value: string };
type DeclaredPackage = { url: string; requirement: PinnedRequirement };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}

function soleKey(record: Record<string, unknown>): string | null {
  const keys = Object.keys(record);
  return keys.length === 1 ? keys[0] : null;
}

function isPinnedKind(kind: string | null): kind is PinnedRequirement['kind'] {
  return PINNED_KINDS.some((pinned) => pinned === kind);
}

/** A copy of normalizeGitUrl in SPMBuild.ts, which imports this module; keep the two in step. */
function normalizeGitUrl(url: string): string {
  return url.replace(/\.git$/, '').toLowerCase();
}

/** A copy of derivePackageNameFromUrl in SPMPackage.ts, which imports this module; keep the two
 * in step. */
function derivePackageNameFromUrl(url: string): string {
  const name = url.substring(url.lastIndexOf('/') + 1);
  return name.endsWith('.git') ? name.slice(0, -4) : name;
}

function describeRequirement({ kind, value }: PinnedRequirement): string {
  return `${kind}: ${JSON.stringify(value)}`;
}

/** The element of a dumped `[value]` payload, the form SwiftPM gives every enum case. */
function sole(payload: unknown): unknown {
  return Array.isArray(payload) && payload.length === 1 ? payload[0] : undefined;
}

/** The trait names a dumped dependency enables, or null when the list has another shape, such as
 * a trait with a condition. */
function traitNames(traits: unknown): string[] | null {
  if (!Array.isArray(traits)) return null;
  const names = traits.flatMap((trait) =>
    isRecord(trait) && soleKey(trait) === 'name' && isNonEmptyString(trait.name) ? [trait.name] : []
  );
  return names.length === traits.length ? names : null;
}

/** The remote packages a dumped manifest declares, keyed by normalized URL. Every other
 * dependency form, and any shape this does not recognize, is rejected rather than skipped. */
function readDeclaredPackages(
  dependencies: unknown,
  fail: ManifestError
): Map<string, DeclaredPackage> {
  const unreadable = (dependency: unknown) =>
    fail(
      `the dumped manifest declares a package dependency that Mode B cannot read: ${JSON.stringify(dependency)}.`,
      'Declare each package as .package(url:exact:), .package(url:branch:), or .package(url:revision:) with a remote URL and a non-empty value.'
    );
  const packages = new Map<string, DeclaredPackage>();
  if (dependencies === undefined) return packages;
  if (!Array.isArray(dependencies)) throw unreadable(dependencies);
  for (const dependency of dependencies) {
    const kind = isRecord(dependency) ? soleKey(dependency) : null;
    const entry = isRecord(dependency) && kind != null ? sole(dependency[kind]) : undefined;
    if (!isRecord(entry)) throw unreadable(dependency);
    if (kind === 'fileSystem') {
      throw fail(
        `the manifest declares local package dependency ${JSON.stringify(entry.path)}, which spmPackages in spm.config.json cannot mirror.`,
        'Remove the .package(path:) declaration, or depend on the package through a remote URL listed in spmPackages.'
      );
    }
    if (kind === 'registry') {
      throw fail(
        `the manifest declares registry package dependency ${JSON.stringify(entry.identity)}, which spmPackages in spm.config.json cannot mirror.`,
        "Use .package(url:exact:) with the package's Git URL instead, and list it in spmPackages."
      );
    }
    const remote = isRecord(entry.location) ? sole(entry.location.remote) : undefined;
    const url = isRecord(remote) ? remote.urlString : undefined;
    if (kind !== 'sourceControl' || !isNonEmptyString(url) || !isRecord(entry.requirement)) {
      throw unreadable(dependency);
    }
    const requirementKind = soleKey(entry.requirement);
    if (requirementKind === 'range') {
      throw fail(
        `the manifest declares ${url} with a version range, which spm.config.json cannot mirror exactly, because SwiftPM reports from: and upToNextMinor: only as the range they expand to.`,
        'Use exact: in Package.swift and the same exact version in spmPackages in spm.config.json.'
      );
    }
    if (!isPinnedKind(requirementKind)) throw unreadable(dependency);
    const value = sole(entry.requirement[requirementKind]);
    if (!isNonEmptyString(value)) throw unreadable(dependency);
    // SwiftPM releases that predate traits omit the list. An empty list disables the default
    // traits, which the generated manifest would silently re-enable.
    const traits = entry.traits === undefined ? ['default'] : traitNames(entry.traits);
    if (traits == null) throw unreadable(dependency);
    if (traits.length === 0) {
      throw fail(
        `the manifest disables the default traits of ${url}, which the generated build manifest would silently re-enable.`,
        'Remove the traits argument, or keep this product in Mode A.'
      );
    }
    if (traits.length !== 1 || traits[0] !== 'default') {
      throw fail(
        `the manifest enables traits ${JSON.stringify(traits)} on ${url} instead of the default traits, which the generated build manifest cannot carry.`,
        'Remove the traits argument, or keep this product in Mode A.'
      );
    }
    const key = normalizeGitUrl(url);
    const existing = packages.get(key);
    if (existing) {
      throw fail(
        `the manifest declares ${existing.url} and ${url}, which name the same package once a trailing .git and letter case are ignored.`,
        'Keep a single .package declaration for it.'
      );
    }
    packages.set(key, { url, requirement: { kind: requirementKind, value } });
  }
  return packages;
}

function readConfiguredRequirement(
  entry: SPMPackageDependencyConfig,
  fail: ManifestError
): PinnedRequirement {
  const version: unknown = entry.version;
  const kind = isRecord(version) ? soleKey(version) : null;
  const value = isRecord(version) && kind != null ? version[kind] : undefined;
  if (kind === 'from' && isNonEmptyString(entry.url) && isNonEmptyString(value)) {
    throw fail(
      `spm.config.json declares ${entry.url} (product "${entry.productName}") with from: ${JSON.stringify(value)}, which a checked-in Package.swift can never match, because Mode B accepts only exact:, branch:, and revision: requirements there.`,
      'Use exact: in spm.config.json and in Package.swift, so both pin the same version.'
    );
  }
  if (!isNonEmptyString(entry.url) || !isPinnedKind(kind) || !isNonEmptyString(value)) {
    throw fail(
      `spm.config.json declares an spmPackages entry that Mode B cannot read: ${JSON.stringify(entry)}.`,
      "Set url to the package's Git URL, and version to exactly one of exact, branch, or revision with a non-empty value."
    );
  }
  return { kind, value };
}

/** The checked-in manifest is the authority for third-party packages, but pod install and other
 * tools still read spmPackages from spm.config.json, so the two must declare the same set. */
function reconcilePackages(
  declared: Map<string, DeclaredPackage>,
  configured: SPMPackageDependencyConfig[],
  fail: ManifestError
): void {
  const differences: string[] = [];
  const configuredKeys = new Set<string>();
  for (const entry of configured) {
    const requirement = readConfiguredRequirement(entry, fail);
    const key = normalizeGitUrl(entry.url);
    configuredKeys.add(key);
    const match = declared.get(key);
    if (!match) {
      differences.push(
        `${entry.url} (${describeRequirement(requirement)}, product "${entry.productName}") is in spmPackages but not declared in Package.swift`
      );
    } else if (
      match.requirement.kind !== requirement.kind ||
      match.requirement.value !== requirement.value
    ) {
      differences.push(
        `${match.url} requires ${describeRequirement(match.requirement)} in Package.swift but ${describeRequirement(requirement)} in spmPackages (product "${entry.productName}")`
      );
    }
  }
  for (const [key, { url, requirement }] of declared) {
    if (!configuredKeys.has(key)) {
      differences.push(
        `${url} (${describeRequirement(requirement)}) is declared in Package.swift but missing from spmPackages`
      );
    }
  }
  if (differences.length > 0) {
    throw fail(
      `its package dependencies do not match spmPackages in spm.config.json: ${differences.join('; ')}. Package.swift is the authority for third-party packages, and spm.config.json keeps a copy because pod install and other tools read spmPackages directly.`,
      'Update spmPackages in spm.config.json to match Package.swift.'
    );
  }
}

function containsSources(directory: string): boolean {
  if (!fs.pathExistsSync(directory)) return false;
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .some((entry) =>
      entry.isDirectory()
        ? containsSources(path.join(directory, entry.name))
        : SOURCE_EXTENSIONS.test(entry.name)
    );
}

function resolveTargetPath(
  root: string,
  target: DumpedTarget,
  regularCount: number
): string | null {
  if (target.path != null) return target.path;
  for (const directory of PREDEFINED_SOURCE_DIRS) {
    const candidate = path.join(directory, target.name);
    if (fs.pathExistsSync(path.join(root, candidate))) return candidate;
  }
  if (regularCount === 1) {
    for (const directory of PREDEFINED_SOURCE_DIRS) {
      if (containsSources(path.join(root, directory))) return directory;
    }
  }
  return null;
}

/** The single relative-path spelling this module compares and emits: POSIX separators, `.` and
 * `..` collapsed, no leading `./`, no trailing `/`. The target directory itself is `''`. */
function canonicalRelative(value: string): string {
  const normalized = path.posix.normalize(value.split(path.sep).join('/')).replace(/\/$/, '');
  return normalized === '.' ? '' : normalized;
}

function isExcluded(relativePath: string, excludes: string[]): boolean {
  const normalized = canonicalRelative(relativePath);
  return excludes.some((exclude) => {
    const prefix = canonicalRelative(exclude);
    return prefix === '' || normalized === prefix || normalized.startsWith(`${prefix}/`);
  });
}

function collectSourceFiles(root: string, sources: string[], excludes: string[]): string[] {
  const files: string[] = [];
  const visit = (absolute: string, relative: string) => {
    if (isExcluded(relative, excludes) || !fs.pathExistsSync(absolute)) return;
    const stat = fs.statSync(absolute);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolute)) {
        visit(path.join(absolute, entry), path.join(relative, entry));
      }
    } else if (SOURCE_EXTENSIONS.test(relative)) {
      files.push(canonicalRelative(relative));
    }
  };
  for (const source of sources) {
    visit(path.join(root, source), source);
  }
  return files;
}

function prefixSourcePath(
  value: string,
  product: string,
  target: string,
  directory = 'target source directory'
): string {
  const prefixed = canonicalRelative(`src/${canonicalRelative(value)}`);
  if (path.isAbsolute(value) || (prefixed !== 'src' && !prefixed.startsWith('src/'))) {
    throw manifestError(
      product,
      target,
      `path ${JSON.stringify(value)} escapes the ${directory}.`,
      directory === 'package root'
        ? 'Keep the target path inside the package root.'
        : 'Keep sources, excludes, resources, and public headers inside the target directory.'
    );
  }
  return prefixed;
}

function inferLanguage(product: string, target: string, files: string[]): 'swift' | 'objc' | 'cpp' {
  if (files.length === 0) {
    throw manifestError(
      product,
      target,
      'its resolved source set is empty, so the pipeline cannot infer its language.',
      'Provide a real target path and sources containing Swift, Objective-C, C, or C++ files, and check that exclude does not remove them all.'
    );
  }
  const hasSwift = files.some((file) => /\.swift$/i.test(file));
  const hasC = files.some((file) => !/\.swift$/i.test(file));
  if (hasSwift && hasC) {
    throw manifestError(
      product,
      target,
      'it mixes Swift and C-family source files, which SwiftPM cannot compile in one target.',
      'Split the files into separate regular targets and declare their dependency.'
    );
  }
  if (hasSwift) return 'swift';
  return files.some((file) => CPP_EXTENSIONS.test(file)) ? 'cpp' : 'objc';
}

async function readExpectedPackageName(root: string, error: ManifestError): Promise<string> {
  const packageJsonPath = path.join(root, 'package.json');
  let packageJson: unknown;
  try {
    packageJson = await fs.readJson(packageJsonPath);
  } catch (cause) {
    throw error(
      `could not read ${packageJsonPath}, which names the SwiftPM package: ${cause instanceof Error ? cause.message : String(cause)}.`,
      'Check that the package directory contains a valid package.json.'
    );
  }
  const name = isRecord(packageJson) ? packageJson.name : undefined;
  if (!isNonEmptyString(name)) {
    throw error(
      `${packageJsonPath} does not declare a non-empty string "name", so the expected SwiftPM package name cannot be derived from it.`,
      'Add the npm package name to package.json.'
    );
  }
  return name.startsWith('@') ? name.slice(1).replace('/', '-') : name;
}

function environmentForTarget(product: SPMProduct, targetName: string): SourceTarget | undefined {
  const target = product.targets.find((candidate) => candidate.name === targetName);
  return target?.type === 'framework' ? undefined : target;
}

/** Keep regular-target filtering and path inference aligned with parseDumpedManifest and
 * resolveTargetPaths in expo/scripts/spm/manifests.js; environment settings belong to config. */
export async function resolveCheckedInManifestAsync(
  root: string,
  product: SPMProduct
): Promise<CheckedInResolvedTarget[]> {
  for (const target of product.targets) {
    if (target.type === 'framework') continue;
    if (target.pattern !== undefined) {
      throw manifestError(
        product.name,
        target.name,
        `spm.config.json declares pattern ${JSON.stringify(target.pattern)}, but a package built from a checked-in Package.swift takes its file set from the manifest and never applies that glob, so the target would silently gain every source file the pattern leaves out.`,
        "Remove pattern from spm.config.json, and narrow the file set with sources or exclude on the target in Package.swift, which is the single authority on a converted package's structure."
      );
    }
    if (
      target.headerPattern !== undefined ||
      target.fileMapping !== undefined ||
      target.moduleMapContent
    ) {
      const field =
        target.headerPattern !== undefined
          ? 'headerPattern'
          : target.fileMapping !== undefined
            ? 'fileMapping'
            : 'moduleMapContent';
      throw manifestError(
        product.name,
        target.name,
        `spm.config.json declares ${field}, but Mode B cannot write generated layout files through its read-only source symlink.`,
        `Remove ${field} and express that layout in Package.swift before adding the manifest.`
      );
    }
  }

  const firstTargetName =
    product.targets.find((target) => target.type !== 'framework')?.name ?? product.name;
  const expectedPackageName = await readExpectedPackageName(root, (what, how) =>
    manifestError(product.name, firstTargetName, what, how)
  );

  let manifest: DumpedManifest;
  try {
    manifest = await dumpManifest(root);
  } catch (error) {
    throw manifestError(
      product.name,
      firstTargetName,
      `Swift Package Manager could not read ${path.join(root, 'Package.swift')}: ${error instanceof Error ? error.message : String(error)}.`,
      'Fix the manifest so `swift package dump-package` succeeds.'
    );
  }
  if (manifest.name !== expectedPackageName) {
    throw manifestError(
      product.name,
      firstTargetName,
      `the manifest declares Package(name: "${manifest.name}"), but this package must be named "${expectedPackageName}". A converted Expo module uses its npm package name as its SwiftPM package name, with a scoped name's "@scope/name" written as "scope-name".`,
      `Set name: "${expectedPackageName}" in the Package(...) call in ${path.join(root, 'Package.swift')}.`
    );
  }

  const allTargets = manifest.targets ?? [];
  const regular = allTargets.filter((target) => target.type === 'regular');
  const regularByName = new Map(regular.map((target) => [target.name, target]));
  const declaredByName = new Map(allTargets.map((target) => [target.name, target]));
  const libraryProduct = (manifest.products ?? []).find(
    (candidate) => candidate.name === product.name && 'library' in (candidate.type ?? {})
  );
  if (!libraryProduct) {
    throw manifestError(
      product.name,
      product.name,
      'the manifest does not declare a library product with this name.',
      `Add .library(name: "${product.name}", targets: [...]) to Package.swift.`
    );
  }
  if (manifest.defaultLocalization != null) {
    const targetName = libraryProduct.targets?.[0] ?? product.name;
    throw manifestError(
      product.name,
      targetName,
      `the manifest declares default localization "${manifest.defaultLocalization}", which the generated target cannot represent.`,
      'Remove the localization or move the localized resource handling out of Mode B.'
    );
  }

  const packagesTargetName =
    libraryProduct.targets?.[0] ??
    product.targets.find((target) => target.type !== 'framework')?.name ??
    product.name;
  const packageError: ManifestError = (what, how) =>
    manifestError(product.name, packagesTargetName, what, how);
  reconcilePackages(
    readDeclaredPackages(manifest.dependencies, packageError),
    product.spmPackages ?? [],
    packageError
  );

  const externalNames = new Set([
    ...(product.externalDependencies ?? []),
    ...(product.spmPackages ?? []).map((dependency) => dependency.productName),
  ]);
  const reachable = new Set<string>();
  const queue = [...(libraryProduct.targets ?? [])];
  while (queue.length > 0) {
    const name = queue.shift()!;
    if (reachable.has(name)) continue;
    const target = regularByName.get(name);
    if (!target) {
      const declared = declaredByName.get(name);
      throw manifestError(
        product.name,
        name,
        `the product references ${declared ? `a ${declared.type}` : 'an unknown'} target that the generated package cannot declare.`,
        'Keep only regular targets in the library product and move unsupported targets out of its dependency graph.'
      );
    }
    reachable.add(name);
    const plugin = target.pluginUsages?.[0];
    if (plugin) {
      throw manifestError(
        product.name,
        target.name,
        `it depends on non-regular target "${plugin.plugin[0]}" (plugin), which the generated package does not mirror.`,
        'Remove the plugin application or move its implementation into a regular target.'
      );
    }
    for (const dependency of target.dependencies ?? []) {
      const dependencyTargetName = dependencyName(dependency);
      if (
        dependency.byName?.[1] != null ||
        dependency.target?.[1] != null ||
        dependency.product?.[3] != null
      ) {
        throw manifestError(
          product.name,
          target.name,
          `dependency "${dependencyTargetName}" has a platform condition, but the generated dependency format cannot preserve it.`,
          'Remove the condition only if the dependency applies to every platform, or keep this product in Mode A.'
        );
      }
      if (dependency.product?.[2] != null) {
        throw manifestError(
          product.name,
          target.name,
          `dependency "${dependencyTargetName}" declares moduleAliases, which the generated dependency format cannot preserve.`,
          'Remove moduleAliases, or keep this product in Mode A.'
        );
      }
      if (dependency.product) {
        const [productName, packageName] = dependency.product;
        const dependencyLabel = `.product(name: "${productName}", package: "${packageName}")`;
        // The generated manifest names the package the way SPMPackage.ts does, and SwiftPM matches
        // it against the package identity regardless of letter case.
        const configuredPackageNames = (product.spmPackages ?? [])
          .filter((entry) => entry.productName === productName)
          .map((entry) => entry.packageName || derivePackageNameFromUrl(entry.url));
        if (configuredPackageNames.length === 0) {
          throw manifestError(
            product.name,
            target.name,
            `it depends on ${dependencyLabel}, but no spmPackages entry in spm.config.json has productName "${productName}".`,
            `Add an spmPackages entry with productName "${productName}", or fix the product name in Package.swift.`
          );
        }
        if (
          !configuredPackageNames.some(
            (configured) => configured.toLowerCase() === packageName.toLowerCase()
          )
        ) {
          throw manifestError(
            product.name,
            target.name,
            `it depends on ${dependencyLabel}, but spm.config.json resolves product "${productName}" to package ${configuredPackageNames.map((name) => JSON.stringify(name)).join(' or ')}, so the generated manifest would take it from a different package.`,
            'Set packageName in spm.config.json or package: in Package.swift so both name the same package; letter case does not matter.'
          );
        }
      } else if (dependencyTargetName && declaredByName.has(dependencyTargetName)) {
        const declared = declaredByName.get(dependencyTargetName)!;
        if (declared.type !== 'regular') {
          throw manifestError(
            product.name,
            target.name,
            `it depends on non-regular target "${dependencyTargetName}" (${declared.type}), which the generated package does not mirror.`,
            'Remove that dependency or move its implementation into a regular target.'
          );
        }
        queue.push(dependencyTargetName);
      } else if (!dependencyTargetName || !externalNames.has(dependencyTargetName)) {
        throw manifestError(
          product.name,
          target.name,
          `it names unknown dependency "${dependencyTargetName ?? JSON.stringify(dependency)}", which the generated package cannot resolve.`,
          'Declare a regular target or list the dependency in externalDependencies or spmPackages in spm.config.json.'
        );
      }
    }
  }

  // Config settings reach a manifest target only by name, so an unmatched config target would
  // silently lose its compilerFlags, linkedFrameworks, and the rest.
  for (const target of product.targets) {
    if (target.type === 'framework' || reachable.has(target.name)) continue;
    if (regularByName.has(target.name)) {
      throw manifestError(
        product.name,
        target.name,
        `spm.config.json gives this target settings, and the manifest declares it, but the library product "${product.name}" does not reach it, so it is never built and those settings apply to nothing.`,
        `Add "${target.name}" to the targets of .library(name: "${product.name}") or to the dependencies of a target the product builds, or remove it from spm.config.json.`
      );
    }
    throw manifestError(
      product.name,
      target.name,
      `spm.config.json declares this target, but the checked-in Package.swift declares no regular target with that name, so the settings spm.config.json gives it apply to nothing.`,
      "Set the target's name in spm.config.json to the one Package.swift declares, or remove the target from spm.config.json."
    );
  }

  for (const target of regular.filter((candidate) => reachable.has(candidate.name))) {
    for (const [productName, packageName] of (target.dependencies ?? []).flatMap((dependency) =>
      dependency.product ? [dependency.product] : []
    )) {
      if (reachable.has(productName)) {
        throw manifestError(
          product.name,
          target.name,
          `dependency .product(name: "${productName}", package: "${packageName}") has the same name as regular target "${productName}", and the generated manifest refers to both by that one name, so it cannot tell them apart.`,
          'Use a target name that differs from every product in spmPackages, or keep this product in Mode A.'
        );
      }
    }
  }

  for (const target of allTargets) {
    if (target.type === 'system' || target.type === 'macro') {
      throw manifestError(
        product.name,
        target.name,
        `the manifest declares an unsupported ${target.type} target.`,
        'Remove it or move it to a package that is not mirrored by the prebuild pipeline.'
      );
    }
  }

  const entryTargets = new Set(libraryProduct.targets ?? []);
  const externalDependencies = product.externalDependencies ?? [];
  const configSourceTargetNames = new Set(
    product.targets.filter((target) => target.type !== 'framework').map((target) => target.name)
  );
  const result: CheckedInResolvedTarget[] = [];
  for (const target of regular.filter((candidate) => reachable.has(candidate.name))) {
    const targetPath = resolveTargetPath(root, target, regular.length);
    if (targetPath != null) prefixSourcePath(targetPath, product.name, target.name, 'package root');
    const sourceRoot = targetPath == null ? null : path.resolve(root, targetPath);
    if (
      sourceRoot == null ||
      !fs.pathExistsSync(sourceRoot) ||
      !fs.statSync(sourceRoot).isDirectory()
    ) {
      throw manifestError(
        product.name,
        target.name,
        `its source path ${JSON.stringify(targetPath)} does not resolve to a real directory.`,
        "Set path in Package.swift to the directory containing this target's sources."
      );
    }
    const prefix = (value: string) => prefixSourcePath(value, product.name, target.name);
    const excludes = target.exclude ?? [];
    const prefixedExcludes = excludes.map(prefix);
    const prefixedSources = target.sources?.map(prefix);
    const prefixedHeaders =
      target.publicHeadersPath == null ? undefined : prefix(target.publicHeadersPath);
    const hasExplicitSources = target.sources !== undefined;
    const declaredSources = target.sources ?? [];
    const nonSources = [...excludes, ...(target.resources ?? []).map((resource) => resource.path)];
    const files = collectSourceFiles(
      sourceRoot,
      hasExplicitSources ? declaredSources : [''],
      nonSources
    );
    const allUnexcludedFiles = collectSourceFiles(sourceRoot, [''], nonSources);
    const uncoveredTests = allUnexcludedFiles.find((file) => file.split('/').includes('Tests'));
    if (uncoveredTests) {
      throw manifestError(
        product.name,
        target.name,
        `its Tests directory contains source "${uncoveredTests}" that is not excluded and would ship in the artifact.`,
        "Add the Tests directory to this target's exclude list in Package.swift."
      );
    }
    const config = environmentForTarget(product, target.name);
    const siblingDependencies = (target.dependencies ?? [])
      .map(dependencyName)
      .filter((name): name is string => name != null && reachable.has(name));
    const configDependencies = (config?.dependencies ?? []).filter(
      (dependency) => !regularByName.has(dependency) && !configSourceTargetNames.has(dependency)
    );
    const dependencies = Array.from(
      new Set([
        ...(target.dependencies ?? [])
          .map(dependencyName)
          .filter((name): name is string => name != null),
        ...configDependencies,
        ...externalDependencies,
      ])
    );
    const resources = (target.resources ?? []).map((resource) => {
      const rule = Object.keys(resource.rule ?? {})[0];
      const options = resource.rule[rule] as { localization?: string } | undefined;
      const localizedPath = resource.path
        .split('/')
        .some((component) => component.endsWith('.lproj'));
      if (options?.localization != null || localizedPath) {
        throw manifestError(
          product.name,
          target.name,
          `resource "${resource.path}" uses localization metadata that the generated target cannot represent.`,
          'Remove the localization or move the localized resource handling out of Mode B.'
        );
      }
      if (rule !== 'copy' && rule !== 'process') {
        throw manifestError(
          product.name,
          target.name,
          `resource "${resource.path}" uses unsupported rule ${JSON.stringify(rule)}.`,
          'Use .copy or .process for resources built by the prebuild pipeline.'
        );
      }
      return { path: prefix(resource.path), rule: rule as 'copy' | 'process' };
    });
    const language = inferLanguage(product.name, target.name, files);
    const sources = prefixedSources ?? ['src'];
    const linkedFrameworks = parseLinkedFrameworks(config?.linkedFrameworks, target.name);
    if (language === 'swift' && (linkedFrameworks.length || siblingDependencies.length)) {
      sources.push(`${product.name}+Exports.swift`);
    }
    result.push({
      type: language,
      name: target.name,
      path: target.name,
      sourceRoot,
      productMember: entryTargets.has(target.name),
      sources,
      exclude: prefixedExcludes,
      dependencies,
      linkedFrameworks,
      resources,
      publicHeadersPath:
        (language === 'objc' || language === 'cpp') && config?.publicHeaders !== false
          ? (prefixedHeaders ?? 'src/include')
          : undefined,
    });
  }
  return result;
}
