import fs from 'fs';
import path from 'path';

import { findModulesAsync } from './autolinking/findModules';
import { resolveModulesAsync } from './autolinking/resolveModules';
import type { LinkingOptionsLoader } from './commands/autolinkingOptions';
import { scanDependenciesInSearchPath } from './dependencies';
import { createMemoizer } from './memoize';
import { createReactNativeConfigAsync } from './reactNativeConfig';
import type { RNConfigDependency } from './reactNativeConfig/reactNativeConfig.types';
import type { ModuleDescriptorIos } from './types';
import { loadPackageJson, scanFilesRecursively } from './utils';

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

/** Resolves the prebuilt-modules metadata document (ENG-25370): the identity
 * join between npm packages, pods, and products, for internal and external
 * products. */
export async function resolvePrebuiltMetadataAsync(
  optionsLoader: LinkingOptionsLoader,
  { mode }: ResolvePrebuiltMetadataOptions = {}
): Promise<PrebuiltMetadataDocument> {
  return createMemoizer().withMemoizer(async () => {
    const appRoot = await optionsLoader.getAppRoot();
    const repoRoot = findExpoRepoRoot();
    const resolvedMode = mode ?? (repoRoot ? 'catalog' : 'app-plan');

    const entries: PrebuiltMetadataDocument = {};
    if (resolvedMode === 'catalog') {
      if (!repoRoot) {
        throw new Error(
          'The prebuilt-metadata catalog requires an expo repository checkout. Use the app-plan mode for standalone projects.'
        );
      }
      await scanRepoPackagesAsync(repoRoot, entries);
    } else {
      await scanResolvedModulesAsync(appRoot, optionsLoader, entries);
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
export function findExpoRepoRoot(): string | null {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  return fs.existsSync(path.join(repoRoot, 'packages', 'expo-modules-core', 'spm.config.json'))
    ? repoRoot
    : null;
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

async function scanRepoPackagesAsync(repoRoot: string, entries: PrebuiltMetadataDocument) {
  const resolutions = await scanDependenciesInSearchPath(path.join(repoRoot, 'packages'));
  for (const name of Object.keys(resolutions).sort()) {
    await addInternalProductsAsync(path.join(resolutions[name]!.path, 'spm.config.json'), entries);
  }
}

async function scanResolvedModulesAsync(
  appRoot: string,
  optionsLoader: LinkingOptionsLoader,
  entries: PrebuiltMetadataDocument
) {
  const autolinkingOptions = await optionsLoader.getPlatformOptions('apple');
  const searchResults = await findModulesAsync({ appRoot, autolinkingOptions });
  const modules = (await resolveModulesAsync(
    searchResults,
    autolinkingOptions
  )) as ModuleDescriptorIos[];
  for (const module of modules) {
    const podspecDir = module.pods?.[0]?.podspecDir;
    if (!podspecDir) {
      continue;
    }
    // Configs live at the podspec dir or its parent (`<package>/ios` layouts).
    for (const dir of [podspecDir, path.dirname(podspecDir)]) {
      const configPath = path.join(dir, 'spm.config.json');
      if (fs.existsSync(configPath)) {
        await addInternalProductsAsync(configPath, entries);
        break;
      }
    }
  }
}

async function addInternalProductsAsync(configPath: string, entries: PrebuiltMetadataDocument) {
  const config = readJsonFile(configPath);
  if (!config) {
    return;
  }
  const packageRoot = path.dirname(configPath);
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packageJson = await loadPackageJson(packageJsonPath);
  if (!packageJson && fs.existsSync(packageJsonPath)) {
    // Ruby skips the whole config when package.json is unreadable.
    return;
  }
  const npmPackage = packageJson?.name || path.basename(packageRoot);
  // Like Ruby, a config that fails mid-processing is warned about and skipped.
  try {
    for (const product of config.products ?? []) {
      const podName = product.podName;
      if (podName == null) {
        continue;
      }
      const podspecDir =
        !fs.existsSync(path.join(packageRoot, 'ios', `${podName}.podspec`)) &&
        fs.existsSync(path.join(packageRoot, `${podName}.podspec`))
          ? packageRoot
          : path.join(packageRoot, 'ios');
      entries[podName] = {
        type: 'internal',
        npmPackage,
        packageRoot,
        podspecDir,
        productName: product.name || podName,
      };
    }
  } catch (error) {
    console.warn(`[prebuilt-metadata] Failed to process ${configPath}: ${error}`);
  }
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
