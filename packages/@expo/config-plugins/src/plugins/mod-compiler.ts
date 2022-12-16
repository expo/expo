import Debug from 'debug';
import path from 'path';

import { ExportedConfig, Mod, ModConfig, ModPlatform } from '../Plugin.types';
import { getHackyProjectName } from '../ios/utils/Xcodeproj';
import { PluginError } from '../utils/errors';
import * as Warnings from '../utils/warnings';
import { assertModResults, ForwardedBaseModOptions } from './createBaseMod';
import { withAndroidBaseMods } from './withAndroidBaseMods';
import { withIosBaseMods } from './withIosBaseMods';

const debug = Debug('expo:config-plugins:mod-compiler');

export function withDefaultBaseMods(
  config: ExportedConfig,
  props: ForwardedBaseModOptions = {}
): ExportedConfig {
  config = withIosBaseMods(config, props);
  config = withAndroidBaseMods(config, props);
  return config;
}

/**
 * Get a prebuild config that safely evaluates mods without persisting any changes to the file system.
 * Currently this only supports infoPlist, entitlements, androidManifest, strings, gradleProperties, and expoPlist mods.
 * This plugin should be evaluated directly:
 */
export function withIntrospectionBaseMods(
  config: ExportedConfig,
  props: ForwardedBaseModOptions = {}
): ExportedConfig {
  config = withIosBaseMods(config, {
    saveToInternal: true,
    // This writing optimization can be skipped since we never write in introspection mode.
    // Including empty mods will ensure that all mods get introspected.
    skipEmptyMod: false,
    ...props,
  });
  config = withAndroidBaseMods(config, {
    saveToInternal: true,
    skipEmptyMod: false,
    ...props,
  });

  if (config.mods) {
    // Remove all mods that don't have an introspection base mod, for instance `dangerous` mods.
    for (const platform of Object.keys(config.mods) as ModPlatform[]) {
      // const platformPreserve = preserve[platform];
      for (const key of Object.keys(config.mods[platform] || {})) {
        // @ts-ignore
        if (!config.mods[platform]?.[key]?.isIntrospective) {
          debug(`removing non-idempotent mod: ${platform}.${key}`);
          // @ts-ignore
          delete config.mods[platform]?.[key];
        }
      }
    }
  }

  return config;
}

/**
 *
 * @param projectRoot
 * @param config
 */
export async function compileModsAsync(
  config: ExportedConfig,
  props: {
    projectRoot: string;
    platforms?: ModPlatform[];
    introspect?: boolean;
    assertMissingModProviders?: boolean;
  }
): Promise<ExportedConfig> {
  if (props.introspect === true) {
    config = withIntrospectionBaseMods(config);
  } else {
    config = withDefaultBaseMods(config);
  }
  return await evalModsAsync(config, props);
}

function sortMods(commands: [string, any][], order: string[]): [string, any][] {
  const allKeys = commands.map(([key]) => key);
  const completeOrder = [...new Set([...order, ...allKeys])];
  const sorted: [string, any][] = [];
  while (completeOrder.length) {
    const group = completeOrder.shift()!;
    const commandSet = commands.find(([key]) => key === group);
    if (commandSet) {
      sorted.push(commandSet);
    }
  }
  return sorted;
}

function getRawClone({ mods, ...config }: ExportedConfig) {
  // Configs should be fully serializable, so we can clone them without worrying about
  // the mods.
  return Object.freeze(JSON.parse(JSON.stringify(config)));
}

const orders: Record<string, string[]> = {
  ios: [
    // dangerous runs first
    'dangerous',
    // run the XcodeProject mod second because many plugins attempt to read from it.
    'xcodeproj',
  ],
  android: ['dangerous'],
};
/**
 * A generic plugin compiler.
 *
 * @param config
 */
export async function evalModsAsync(
  config: ExportedConfig,
  {
    projectRoot,
    introspect,
    platforms,
    /**
     * Throw errors when mods are missing providers.
     * @default true
     */
    assertMissingModProviders,
  }: {
    projectRoot: string;
    introspect?: boolean;
    assertMissingModProviders?: boolean;
    platforms?: ModPlatform[];
  }
): Promise<ExportedConfig> {
  const modRawConfig = getRawClone(config);
  for (const [platformName, platform] of Object.entries(config.mods ?? ({} as ModConfig))) {
    if (platforms && !platforms.includes(platformName as any)) {
      debug(`skip platform: ${platformName}`);
      continue;
    }

    let entries = Object.entries(platform);
    if (entries.length) {
      // Move dangerous item to the first position if it exists, this ensures that all dangerous code runs first.
      entries = sortMods(entries, orders[platformName]!);
      debug(`run in order: ${entries.map(([name]) => name).join(', ')}`);
      const platformProjectRoot = path.join(projectRoot, platformName);
      const projectName =
        platformName === 'ios' ? getHackyProjectName(projectRoot, config) : undefined;

      for (const [modName, mod] of entries) {
        const modRequest = {
          projectRoot,
          projectName,
          platformProjectRoot,
          platform: platformName as ModPlatform,
          modName,
          introspect: !!introspect,
        };

        if (!(mod as Mod).isProvider) {
          // In strict mode, throw an error.
          const errorMessage = `Initial base modifier for "${platformName}.${modName}" is not a provider and therefore will not provide modResults to child mods`;
          if (assertMissingModProviders !== false) {
            throw new PluginError(errorMessage, 'MISSING_PROVIDER');
          } else {
            Warnings.addWarningForPlatform(
              platformName as ModPlatform,
              `${platformName}.${modName}`,
              `Skipping: Initial base modifier for "${platformName}.${modName}" is not a provider and therefore will not provide modResults to child mods. This may be due to an outdated version of Expo CLI.`
            );
            // In loose mode, just skip the mod entirely.
            continue;
          }
        }

        const results = await (mod as Mod)({
          ...config,
          modResults: null,
          modRequest,
          modRawConfig,
        });

        // Sanity check to help locate non compliant mods.
        config = assertModResults(results, platformName, modName);
        // @ts-ignore: `modResults` is added for modifications
        delete config.modResults;
        // @ts-ignore: `modRequest` is added for modifications
        delete config.modRequest;
        // @ts-ignore: `modRawConfig` is added for modifications
        delete config.modRawConfig;
      }
    }
  }

  return config;
}
