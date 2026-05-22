import JsonFile, { JSONObject } from '@expo/json-file';
import type { ConfigT as MetroConfig } from '@expo/metro/metro-config';
import { resolveFrom, loadModuleSync } from '@expo/require-utils';
import fs from 'node:fs';
import path from 'node:path';

import { isPathInside } from '../../../utils/dir';

interface LoadMetroConfigParams {
  serverRoot: string;
  projectRoot: string;
  overrideConfigPath?: string | undefined;
}

interface ResolvePackageJsonResult {
  filePath: string;
  config: JSONObject;
}

const configExtensions = ['.js', '.cjs', '.mjs', '.json', '.ts', '.cts', '.mts'];

const resolveConfigFromPath = (filePath: string, projectRoot: string): string | null => {
  const inputPath = path.resolve(process.cwd(), filePath);
  const normalized = `.${path.sep}${path.relative(projectRoot, inputPath)}`;
  const resolved = resolveFrom(projectRoot, normalized, { extensions: configExtensions });
  return resolved ?? path.resolve(projectRoot, filePath);
};

const resolvePackageJsonConfig = (searchPath: string): ResolvePackageJsonResult | null => {
  const target = path.resolve(searchPath, 'package.json');
  const stat = fs.lstatSync(target, { throwIfNoEntry: false });
  if (!stat?.isFile()) {
    return null;
  }
  const json = new JsonFile(target).read();
  if (json.metro != null && typeof json.metro === 'object' && !Array.isArray(json.metro)) {
    return {
      filePath: target,
      config: json.metro,
    };
  } else {
    return null;
  }
};

type RawMetroConfig =
  | ((baseConfig: MetroConfig) => Promise<MetroConfig>)
  | ((baseConfig: MetroConfig) => MetroConfig)
  | MetroConfig;

export interface ResolveMetroConfigResult {
  filepath: string;
  isEmpty: boolean;
  config: RawMetroConfig;
}

const loadConfigFile = async (configPath: string): Promise<RawMetroConfig> => {
  if (configPath.endsWith('.json')) {
    const json = new JsonFile(configPath).read() as any;
    return path.basename(configPath) === 'package.json' ? json.metro : json;
  }
  // Using sync variant to match Expo config/config-plugins
  const mod = loadModuleSync(configPath);
  return await (mod.__esModule ? mod.default : mod);
};

export async function loadMetroConfigFileAsync(
  params: LoadMetroConfigParams
): Promise<ResolveMetroConfigResult> {
  let configPath: string | null = null;
  if (params.overrideConfigPath) {
    configPath = resolveConfigFromPath(params.overrideConfigPath, params.projectRoot);
  } else {
    // NOTE(@kitten): Metro usually traverses beyond the server root, but we deem this unsafe
    const startPath = path.resolve(params.projectRoot);
    const stopPath = path.resolve(params.serverRoot);

    // Search upwards until the server root
    let searchPath = startPath;
    while (configPath == null && (searchPath === stopPath || isPathInside(searchPath, stopPath))) {
      configPath = resolveFrom(searchPath, './metro.config', { extensions: configExtensions });

      // Metro searches for .config/metro.[ext] next
      if (configPath == null) {
        configPath = resolveFrom(searchPath, './.config/metro', { extensions: configExtensions });
      }

      if (configPath == null && searchPath === startPath) {
        // At each level, also check the package.json for "metro" entry
        // NOTE(@kitten): Metro actually searches in each package.json upwards, but we're dropping
        // support for this, since this is very unexpected
        const packageJsonResult = resolvePackageJsonConfig(searchPath);
        if (packageJsonResult) {
          configPath = packageJsonResult.filePath;
          break;
        }
      }

      searchPath = path.dirname(searchPath);
    }
  }

  if (configPath == null) {
    // No config file found, return a default
    return {
      isEmpty: true,
      filepath: path.join(params.projectRoot, 'metro.config.stub.js'),
      config: {} as any,
    };
  } else {
    return {
      isEmpty: false,
      filepath: configPath,
      config: await loadConfigFile(configPath),
    };
  }
}
