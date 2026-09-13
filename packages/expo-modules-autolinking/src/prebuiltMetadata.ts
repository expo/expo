import fs from 'fs';
import path from 'path';

import { findModulesAsync } from './autolinking/findModules';
import type { LinkingOptionsLoader } from './commands/autolinkingOptions';
import { scanDependenciesInSearchPath } from './dependencies';
import { createMemoizer } from './memoize';
import { createReactNativeConfigAsync } from './reactNativeConfig';
import type { RNConfigDependency } from './reactNativeConfig/reactNativeConfig.types';
import { scanFilesRecursively } from './utils';

export interface PrebuiltMetadataEntry {
  type: 'internal' | 'external';
  npmPackage: string;
  packageRoot: string;
  podspecDir: string;
  productName: string;
}

export type PrebuiltMetadataDocument = Record<string, PrebuiltMetadataEntry>;

export interface ResolvePrebuiltMetadataOptions {
  /** 'catalog' scans the expo repository's packages/ tree (app-independent);
   * 'app-plan' locates configs through the app's module resolution.
   * Defaults to 'catalog' inside an expo repository checkout, 'app-plan' elsewhere. */
  mode?: 'catalog' | 'app-plan';
}

/** Package identity as both discovery modes already report it. */
type DiscoveredPackages = Record<string, { path: string } | undefined>;

/** Resolves the prebuilt-modules metadata document (ENG-25370): the identity
 * join between npm packages, pods, and products, for internal and external
 * products. */
export async function resolvePrebuiltMetadataAsync(
  optionsLoader: LinkingOptionsLoader,
  { mode }: ResolvePrebuiltMetadataOptions = {}
): Promise<PrebuiltMetadataDocument> {
  return createMemoizer().withMemoizer(async () => {
    const appRoot = await optionsLoader.getAppRoot();
    const resolvedMode = mode ?? (findExpoRepoRoot() ? 'catalog' : 'app-plan');
    const packages =
      resolvedMode === 'catalog'
        ? await scanRepoPackagesAsync()
        : await findAppPackagesAsync(appRoot, optionsLoader);

    const entries: PrebuiltMetadataDocument = {};
    for (const name of Object.keys(packages).sort()) {
      const packageRoot = packages[name]?.path;
      if (packageRoot) {
        addInternalProducts(entries, packageRoot);
      }
    }

    const reactNativeConfig = await createReactNativeConfigAsync({
      autolinkingOptions: await optionsLoader.getPlatformOptions('ios'),
      appRoot,
      sourceDir: undefined,
    });
    await scanExternalConfigsAsync(reactNativeConfig.dependencies ?? {}, entries);

    return Object.fromEntries(
      Object.keys(entries)
        .sort()
        .map((podName) => [podName, entries[podName]!])
    );
  });
}

/** The expo repository root when this package runs from its packages/ checkout
 * (its own location is the same anchor used for external-configs below). */
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

function addInternalProducts(entries: PrebuiltMetadataDocument, packageRoot: string) {
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
      entries[podName] = {
        type: 'internal',
        npmPackage,
        packageRoot,
        podspecDir: resolvePodspecDir(packageRoot, podName),
        productName: product.name || podName,
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
  entries: PrebuiltMetadataDocument
) {
  const externalConfigsDir = path.join(__dirname, '..', 'external-configs', 'ios');
  for await (const file of scanFilesRecursively(externalConfigsDir, undefined, true)) {
    if (file.name !== 'spm.config.json') {
      continue;
    }
    const npmPackage = path.relative(externalConfigsDir, file.parentPath).split(path.sep).join('/');
    const packageRoot = dependencies[npmPackage]?.root;
    if (!packageRoot) {
      continue;
    }
    const config = readJsonFile(file.path);
    try {
      for (const product of config?.products ?? []) {
        const podName = product.podName;
        if (podName == null) {
          continue;
        }
        entries[podName] = {
          type: 'external',
          npmPackage,
          packageRoot,
          podspecDir: packageRoot,
          productName: product.name || podName,
        };
      }
    } catch (error) {
      console.warn(`[prebuilt-metadata] Failed to process ${file.path}: ${error}`);
    }
  }
}
