import type commander from 'commander';
import fs from 'fs';
import path from 'path';

import { scanDependenciesInSearchPath } from '../dependencies';
import { createReactNativeConfigAsync } from '../reactNativeConfig';
import type { RNConfigDependency } from '../reactNativeConfig/reactNativeConfig.types';
import { scanFilesRecursively } from '../utils';
import type { AutolinkingCommonArguments } from './autolinkingOptions';
import { createAutolinkingOptionsLoader, registerAutolinkingArguments } from './autolinkingOptions';

interface PrebuiltMetadataArguments extends AutolinkingCommonArguments {
  json?: boolean | null;
}

export interface PrebuiltMetadataEntry {
  type: 'internal' | 'external';
  npmPackage: string;
  packageRoot: string;
  podspecDir: string;
  productName: string;
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

/** The expo repository root when this package runs from its packages/ checkout
 * (its own location is the same anchor used for external-configs below). */
function findExpoRepoRoot(): string | null {
  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
  return fs.existsSync(path.join(repoRoot, 'packages', 'expo-modules-core', 'spm.config.json'))
    ? repoRoot
    : null;
}

async function scanInternalConfigs(
  repoRoot: string,
  entries: Record<string, PrebuiltMetadataEntry>
) {
  const resolutions = await scanDependenciesInSearchPath(path.join(repoRoot, 'packages'));
  for (const npmPackage of Object.keys(resolutions).sort()) {
    const packageRoot = resolutions[npmPackage]!.path;
    const config = readJsonFile(path.join(packageRoot, 'spm.config.json'));
    if (!config) {
      continue;
    }
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
  }
}

async function scanExternalConfigs(
  dependencies: Record<string, RNConfigDependency>,
  entries: Record<string, PrebuiltMetadataEntry>
) {
  const externalConfigsDir = path.join(__dirname, '..', '..', 'external-configs', 'ios');
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
  }
}

/** Emits the prebuilt-modules metadata document (ENG-25370): the identity join
 * between npm packages, pods, and products, for internal and external products. */
export function prebuiltMetadataCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('prebuilt-metadata [searchPaths...]'))
    .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .action(async (searchPaths: string[] | null, commandArguments: PrebuiltMetadataArguments) => {
      const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
        ...commandArguments,
        searchPaths,
      });
      const appRoot = await autolinkingOptionsLoader.getAppRoot();
      const repoRoot = findExpoRepoRoot();
      if (!repoRoot) {
        throw new Error(
          'prebuilt-metadata currently requires an expo repository checkout. Support for standalone projects arrives with a later ENG-25370 phase.'
        );
      }

      const entries: Record<string, PrebuiltMetadataEntry> = {};
      await scanInternalConfigs(repoRoot, entries);

      const reactNativeConfig = await createReactNativeConfigAsync({
        autolinkingOptions: await autolinkingOptionsLoader.getPlatformOptions('ios'),
        appRoot,
        sourceDir: undefined,
      });
      await scanExternalConfigs(reactNativeConfig.dependencies ?? {}, entries);

      const sorted = Object.fromEntries(
        Object.keys(entries)
          .sort()
          .map((podName) => [podName, entries[podName]])
      );
      if (commandArguments.json) {
        console.log(JSON.stringify(sorted));
      } else {
        console.log(require('util').inspect(sorted, false, null, true));
      }
    });
}
