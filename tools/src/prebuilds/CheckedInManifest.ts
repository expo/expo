import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';

import { getPackagesDir } from '../Directories';
import logger from '../Logger';
import { isExternalPackage, type SPMPackageSource } from './ExternalPackage';
import type { SPMProduct, SourceTarget } from './SPMConfig.types';
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
  product?: [string, string, unknown?];
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
  return dependency.byName?.[0] ?? dependency.target?.[0] ?? null;
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

function normalizedRelative(value: string): string {
  return value.split(path.sep).join('/').replace(/^\.\//, '').replace(/\/$/, '');
}

function isExcluded(relativePath: string, excludes: string[]): boolean {
  const normalized = normalizedRelative(relativePath);
  return excludes.some((exclude) => {
    const prefix = normalizedRelative(exclude);
    return normalized === prefix || normalized.startsWith(`${prefix}/`);
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
      files.push(normalizedRelative(relative));
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
  const prefixed = normalizedRelative(path.posix.join('src', normalizedRelative(value)));
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
      'Provide a real target path and sources containing Swift, Objective-C, C, or C++ files.'
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
    if (
      target.type !== 'framework' &&
      (target.headerPattern !== undefined ||
        target.fileMapping !== undefined ||
        target.moduleMapContent)
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

  let manifest: DumpedManifest;
  try {
    manifest = await dumpManifest(root);
  } catch (error) {
    const targetName =
      product.targets.find((target) => target.type !== 'framework')?.name ?? product.name;
    throw manifestError(
      product.name,
      targetName,
      `Swift Package Manager could not read ${path.join(root, 'Package.swift')}: ${error instanceof Error ? error.message : String(error)}.`,
      'Fix the manifest so `swift package dump-package` succeeds.'
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
      if (dependency.product) {
        throw manifestError(
          product.name,
          target.name,
          `it depends on .product(name: "${dependency.product[0]}", package: "${dependency.product[1]}"), which Mode B cannot inject safely.`,
          'Remove the .product dependency and declare the external package through spm.config.json.'
        );
      }
      const dependencyTargetName = dependencyName(dependency);
      if (dependency.byName?.[1] != null || dependency.target?.[1] != null) {
        throw manifestError(
          product.name,
          target.name,
          `dependency "${dependencyTargetName}" has a platform condition, but the generated dependency format cannot preserve it.`,
          'Remove the condition only if the dependency applies to every platform, or keep this product in Mode A.'
        );
      }
      if (dependencyTargetName && declaredByName.has(dependencyTargetName)) {
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

  if ((manifest.dependencies ?? []).length > 0) {
    const targetName =
      libraryProduct.targets?.[0] ??
      product.targets.find((target) => target.type !== 'framework')?.name ??
      product.name;
    throw manifestError(
      product.name,
      targetName,
      'the manifest declares external package dependencies, but the generated build manifest owns external dependencies.',
      'Remove the .package declaration and declare the dependency in spm.config.json.'
    );
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
    if (language === 'swift' && (config?.linkedFrameworks?.length || siblingDependencies.length)) {
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
      linkedFrameworks: config?.linkedFrameworks ?? [],
      resources,
      publicHeadersPath:
        (language === 'objc' || language === 'cpp') && config?.publicHeaders !== false
          ? (prefixedHeaders ?? 'src/include')
          : undefined,
    });
  }
  return result;
}
