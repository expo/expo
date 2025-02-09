import Debug from 'debug';
import path from 'path';

import { assertModResults, ForwardedBaseModOptions } from './createBaseMod';
import { withAndroidBaseMods } from './withAndroidBaseMods';
import { withIosBaseMods } from './withIosBaseMods';
import { ExportedConfig, Mod, ModConfig, ModPlatform } from '../Plugin.types';
import { getHackyProjectName } from '../ios/utils/Xcodeproj';
import { PluginError } from '../utils/errors';
import * as Warnings from '../utils/warnings';

const debug = Debug('expo:config-plugins:mod-compiler');

export type PrebuildSettings = {
  /** Current working directory. Should be one level up from the platform directories. */
  projectRoot: string;
  /** Should compile modifiers in introspection mode (dry run). */
  introspect?: boolean;
  /** Array of platforms to compile */
  platforms?: ModPlatform[];
  /**
   * Throw errors when mods are missing providers.
   * @default true
   */
  assertMissingModProviders?: boolean;
  /** If provided, the providers will reset the input source from this template instead of the existing project root. */
  templateProjectRoot?: string;

  /** */
  ignoreExistingNativeFiles?: boolean;
};

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

/** Compile modifiers in a prebuild config. */
export async function compileModsAsync(
  config: ExportedConfig,
  props: PrebuildSettings
): Promise<ExportedConfig> {
  if (props.introspect === true) {
    config = withIntrospectionBaseMods(config);
  } else {
    config = withDefaultBaseMods(config);
  }
  return await evalModsAsync(config, props);
}

export function sortMods(
  commands: [string, any][],
  precedences: Record<string, number>
): [string, any][] {
  const seen = new Set();
  const dedupedCommands = commands.filter(([key]) => {
    const duplicate = seen.has(key);
    seen.add(key);
    return !duplicate;
  });

  return dedupedCommands.sort(([keyA], [keyB]) => {
    const precedenceA = precedences[keyA] || 0;
    const precedenceB = precedences[keyB] || 0;
    return precedenceA - precedenceB;
  });
}

function getRawClone({ mods, ...config }: ExportedConfig) {
  // Configs should be fully serializable, so we can clone them without worrying about
  // the mods.
  return Object.freeze(JSON.parse(JSON.stringify(config)));
}

const precedences: Record<string, Record<string, number>> = {
  ios: {
    // dangerous runs first
    dangerous: -2,
    // run the XcodeProject mod second because many plugins attempt to read from it.
    xcodeproj: -1,
    // put the finalized mod at the last
    finalized: 1,
  },
};

/** A generic plugin compiler. */
export async function evalModsAsync(
  config: ExportedConfig,
  {
    projectRoot,
    introspect,
    platforms,
    assertMissingModProviders,
    templateProjectRoot,
    ignoreExistingNativeFiles = false,
  }: PrebuildSettings
): Promise<ExportedConfig> {
  const modRawConfig = getRawClone(config);
  for (const [platformName, platform] of Object.entries(config.mods ?? ({} as ModConfig))) {
    if (platforms && !platforms.includes(platformName as any)) {
      debug(`skip platform: ${platformName}`);
      continue;
    }

    let entries = Object.entries(platform);
    if (entries.length) {
      // Move dangerous item to the first position and finalized item to the last position if it exists.
      // This ensures that all dangerous code runs first and finalized applies last.
      entries = sortMods(entries, precedences[platformName] ?? { dangerous: -1, finalized: 1 });
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
          templateProjectRoot,
          ignoreExistingNativeFiles,
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
