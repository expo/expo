import fs from 'fs';
import path from 'path';

import { findModulesAsync } from './autolinking/findModules';
import type { LinkingOptionsLoader } from './commands/autolinkingOptions';
import { scanDependenciesInSearchPath } from './dependencies';
import { createMemoizer } from './memoize';
import {
  buildVersionPrefix,
  getArtifactBases,
  getArtifactSuffixes,
  getRemoteArtifactKey,
  getSharedSpmDepBases,
  getSharedSpmDepSuffix,
  PREBUILT_FLAVORS,
  type ArtifactSuffixes,
  type PrebuiltFlavor,
} from './prebuiltArtifactPaths';
import { createReactNativeConfigAsync } from './reactNativeConfig';
import type { RNConfigDependency } from './reactNativeConfig/reactNativeConfig.types';
import { scanFilesRecursively } from './utils';

/** `remoteKey` is external-only: the artifact store is never written for internal
 * products, so a key for one would address something that cannot exist. */
export type PrebuiltArtifactFlavorPaths = ArtifactSuffixes & { remoteKey?: string };

export type PrebuiltSharedSpmDepLocator = Record<PrebuiltFlavor, string> & { bases: string[] };

/** Where a product's xcframeworks may live. Both flavors are always described,
 * because the CocoaPods integrator stages both and picks one inside Xcode. */
export type PrebuiltArtifactLocator = Record<PrebuiltFlavor, PrebuiltArtifactFlavorPaths> & {
  bases: string[];
  sharedSpmDeps: Record<string, PrebuiltSharedSpmDepLocator>;
};

export interface PrebuiltMetadataEntry {
  type: 'internal' | 'external';
  npmPackage: string;
  packageRoot: string;
  podspecDir: string;
  productName: string;
  artifact: PrebuiltArtifactLocator;
}

export type PrebuiltMetadataDocument = Record<string, PrebuiltMetadataEntry>;

export interface ResolvePrebuiltMetadataOptions {
  /** 'catalog' scans the expo repository's packages/ tree (app-independent);
   * 'app-plan' locates configs through the app's module resolution.
   * Defaults to 'catalog' inside an expo repository checkout, 'app-plan' elsewhere. */
  mode?: 'catalog' | 'app-plan';
  /** External products are published under `<packageVersion>/<reactNativeVersion>/<hermesVersion>`.
   * The package version is read per package during the scan; resolving the other two stays
   * with the caller until ENG-26089 single-sources them. Whenever one of the three is
   * missing, that package's candidates degrade to the unversioned ones, as Ruby does. */
  reactNativeVersion?: string | null;
  hermesVersion?: string | null;
  /** Overrides the monorepo build directory. Omit it to read `EXPO_PRECOMPILED_MODULES_PATH`,
   * the same variable the CocoaPods integrator reads; pass null to ignore that variable. */
  customModulesPath?: string | null;
}

/** The parts of the artifact grammar that are the same for every product in one run. */
interface ArtifactContext {
  repoRoot: string | null;
  customModulesPath: string | null;
  reactNativeVersion: string | null;
  hermesVersion: string | null;
}

/** Package identity as both discovery modes already report it. */
type DiscoveredPackages = Record<string, { path: string } | undefined>;

/** Resolves the prebuilt-modules metadata document (ENG-25370): the identity
 * join between npm packages, pods, and products, for internal and external
 * products. */
export async function resolvePrebuiltMetadataAsync(
  optionsLoader: LinkingOptionsLoader,
  {
    mode,
    reactNativeVersion,
    hermesVersion,
    customModulesPath,
  }: ResolvePrebuiltMetadataOptions = {}
): Promise<PrebuiltMetadataDocument> {
  return createMemoizer().withMemoizer(async () => {
    const appRoot = await optionsLoader.getAppRoot();
    const repoRoot = findExpoRepoRoot();
    const resolvedMode = mode ?? (repoRoot ? 'catalog' : 'app-plan');
    const packages =
      resolvedMode === 'catalog'
        ? await scanRepoPackagesAsync()
        : await findAppPackagesAsync(appRoot, optionsLoader);

    const artifactContext: ArtifactContext = {
      repoRoot,
      customModulesPath:
        customModulesPath !== undefined
          ? customModulesPath
          : (process.env.EXPO_PRECOMPILED_MODULES_PATH ?? null),
      reactNativeVersion: reactNativeVersion ?? null,
      hermesVersion: hermesVersion ?? null,
    };

    const entries: PrebuiltMetadataDocument = {};
    for (const name of Object.keys(packages).sort()) {
      const packageRoot = packages[name]?.path;
      if (packageRoot) {
        addInternalProducts(entries, packageRoot, artifactContext);
      }
    }

    const reactNativeConfig = await createReactNativeConfigAsync({
      autolinkingOptions: await optionsLoader.getPlatformOptions('ios'),
      appRoot,
      sourceDir: undefined,
    });
    await scanExternalConfigsAsync(reactNativeConfig.dependencies ?? {}, entries, artifactContext);

    return Object.fromEntries(
      Object.keys(entries)
        .sort()
        .map((podName) => [podName, entries[podName]!])
    );
  });
}

/** The expo repository root when this package runs from its packages/ checkout
 * (its own location is the same anchor used for external-configs below).
 * precompiled_modules.rb:1821 instead walks up from the app, so a checkout that
 * resolves this package outside packages/ (a pnpm store path) yields null here
 * while Ruby still finds the root. */
function findExpoRepoRoot(): string | null {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  return fs.existsSync(path.join(repoRoot, 'packages', 'expo-modules-core', 'spm.config.json'))
    ? repoRoot
    : null;
}

/** Every package in the expo repository, whether or not an app depends on it. */
async function scanRepoPackagesAsync(): Promise<DiscoveredPackages> {
  const repoRoot = findExpoRepoRoot();
  if (!repoRoot) {
    throw new Error(
      'The prebuilt-metadata catalog requires an expo repository checkout. Use the app-plan mode for standalone projects.'
    );
  }
  return scanDependenciesInSearchPath(path.join(repoRoot, 'packages'));
}

/** Only the packages the app itself resolves. */
async function findAppPackagesAsync(
  appRoot: string,
  optionsLoader: LinkingOptionsLoader
): Promise<DiscoveredPackages> {
  return findModulesAsync({
    appRoot,
    autolinkingOptions: await optionsLoader.getPlatformOptions('apple'),
  });
}

function readJsonFile(filePath: string): any | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn(`[prebuilt-metadata] Failed to read ${filePath}: ${error}`);
    return null;
  }
}

function addInternalProducts(
  entries: PrebuiltMetadataDocument,
  packageRoot: string,
  artifactContext: ArtifactContext
) {
  const configPath = path.join(packageRoot, 'spm.config.json');
  const config = readJsonFile(configPath);
  if (!config) {
    return;
  }
  // Both resolvers synthesize a name from the directory when package.json cannot be
  // read, so the npm name is only trustworthy from the manifest itself. Like Ruby,
  // skip the config rather than emit a name derived from the path.
  const npmPackage = readJsonFile(path.join(packageRoot, 'package.json'))?.name;
  if (!npmPackage) {
    return;
  }
  // Like Ruby, a config that fails mid-processing is warned about and skipped.
  try {
    for (const product of config.products ?? []) {
      const podName = product.podName;
      if (podName == null) {
        continue;
      }
      const productName = product.name || podName;
      entries[podName] = {
        type: 'internal',
        npmPackage,
        packageRoot,
        podspecDir: resolvePodspecDir(packageRoot, podName),
        productName,
        artifact: buildArtifactLocator(
          { type: 'internal', npmPackage, packageRoot, productName, product, versionPrefix: null },
          artifactContext
        ),
      };
    }
  } catch (error) {
    console.warn(`[prebuilt-metadata] Failed to process ${configPath}: ${error}`);
  }
}

/** Podspecs live in `ios/` unless the package keeps one at its root. */
function resolvePodspecDir(packageRoot: string, podName: string): string {
  return !fs.existsSync(path.join(packageRoot, 'ios', `${podName}.podspec`)) &&
    fs.existsSync(path.join(packageRoot, `${podName}.podspec`))
    ? packageRoot
    : path.join(packageRoot, 'ios');
}

async function scanExternalConfigsAsync(
  dependencies: Record<string, RNConfigDependency>,
  entries: PrebuiltMetadataDocument,
  artifactContext: ArtifactContext
) {
  const externalConfigsDir = path.join(__dirname, '..', 'external-configs', 'ios');
  for await (const file of scanFilesRecursively(externalConfigsDir, undefined, true)) {
    if (file.name !== 'spm.config.json') {
      continue;
    }
    const npmPackage = path.relative(externalConfigsDir, file.parentPath).split(path.sep).join('/');
    const dependency = dependencies[npmPackage];
    if (!dependency?.root) {
      continue;
    }
    const packageRoot = dependency.root;
    // precompiled_modules.rb:1564,1570-1573: the version react-native config reports for
    // the installed package wins, its manifest is the fallback.
    const packageVersion: string | undefined =
      dependency.platforms?.ios?.version ??
      readJsonFile(path.join(packageRoot, 'package.json'))?.version;
    const versionPrefix = buildVersionPrefix(
      packageVersion,
      artifactContext.reactNativeVersion,
      artifactContext.hermesVersion
    );
    const config = readJsonFile(file.path);
    try {
      for (const product of config?.products ?? []) {
        const podName = product.podName;
        if (podName == null) {
          continue;
        }
        const productName = product.name || podName;
        entries[podName] = {
          type: 'external',
          npmPackage,
          packageRoot,
          podspecDir: packageRoot,
          productName,
          artifact: buildArtifactLocator(
            { type: 'external', npmPackage, packageRoot, productName, product, versionPrefix },
            artifactContext
          ),
        };
      }
    } catch (error) {
      console.warn(`[prebuilt-metadata] Failed to process ${file.path}: ${error}`);
    }
  }
}

/** The product fields the artifact grammar needs, as spm.config.json declares them. */
interface SpmConfigProduct {
  spmPackages?: { productName?: string }[];
}

interface CommonProductIdentity {
  npmPackage: string;
  packageRoot: string;
  productName: string;
  product: SpmConfigProduct;
}

/** The version prefix is per package, since external packages are versioned independently
 * of each other. Internal products are never published under one, so their variant admits
 * nothing else. */
type ProductIdentity =
  | (CommonProductIdentity & { type: 'internal'; versionPrefix: null })
  | (CommonProductIdentity & { type: 'external'; versionPrefix: string | null });

function byFlavor<T>(build: (flavor: PrebuiltFlavor) => T): Record<PrebuiltFlavor, T> {
  return Object.fromEntries(PREBUILT_FLAVORS.map((flavor) => [flavor, build(flavor)])) as Record<
    PrebuiltFlavor,
    T
  >;
}

function buildArtifactLocator(
  { type, npmPackage, packageRoot, productName, product, versionPrefix }: ProductIdentity,
  { repoRoot, customModulesPath }: ArtifactContext
): PrebuiltArtifactLocator {
  const common = { npmPackage, packageRoot, customModulesPath, repoRoot };
  return {
    bases: getArtifactBases(
      type === 'external' ? { ...common, type, versionPrefix } : { ...common, type: 'internal' }
    ),
    ...byFlavor((flavor) => ({
      ...getArtifactSuffixes(productName, flavor),
      ...(type === 'external' && {
        remoteKey: getRemoteArtifactKey(npmPackage, versionPrefix, productName, flavor),
      }),
    })),
    sharedSpmDeps: Object.fromEntries(
      sharedSpmDepNames(product).map((depName) => [
        depName,
        {
          bases: getSharedSpmDepBases(depName, { packageRoot, customModulesPath, repoRoot }),
          ...byFlavor((flavor) => getSharedSpmDepSuffix(depName, flavor)),
        },
      ])
    ),
  };
}

/** Mirrors precompiled_modules.rb: the shared xcframeworks a product bundles are the
 * product names of its SPM packages. */
function sharedSpmDepNames(product: SpmConfigProduct): string[] {
  return (product?.spmPackages ?? [])
    .map((spmPackage) => spmPackage?.productName)
    .filter((name): name is string => !!name);
}
