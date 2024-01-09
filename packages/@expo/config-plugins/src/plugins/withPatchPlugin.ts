import type { ExpoConfig } from '@expo/config-types';
import { boolish } from 'getenv';
import { glob } from 'glob';
import path from 'path';

import { withMod } from './withMod';
import { withRunOnce } from './withRunOnce';
import type { ConfigPlugin, ModPlatform } from '../Plugin.types';
import { applyPatchAsync, getPatchChangedLinesAsync } from '../utils/gitPatch';
import { addWarningForPlatform } from '../utils/warnings';

const EXPO_DEBUG = boolish('EXPO_DEBUG', false);

interface PatchPluginProps {
  /** The directory to search for patch files in. */
  patchRoot: string;
  /** The maximum changed lines allowed in the patch file, if exceeded the patch will show a warning. */
  changedLinesLimit: number;
}

const withPatchMod: ConfigPlugin<ModPlatform> = (config, platform) => {
  return withMod(config, {
    platform,
    mod: 'patch',
    action: async (config) => {
      const props = createPropsFromConfig(config);
      const projectRoot = config.modRequest.projectRoot;
      const templateChecksum = config._internal?.templateChecksum ?? '';
      const patchFilePath = await determinePatchFilePathAsync(
        projectRoot,
        platform,
        templateChecksum,
        props
      );
      if (patchFilePath != null) {
        const changedLines = await getPatchChangedLinesAsync(patchFilePath);
        if (changedLines > props.changedLinesLimit) {
          addWarningForPlatform(
            platform,
            'withPatchPlugin',
            `The patch file "${patchFilePath}" has ${changedLines} changed lines, which exceeds the limit of ${props.changedLinesLimit}.`
          );
        }

        await applyPatchAsync(projectRoot, patchFilePath);
      }
      return config;
    },
  });
};

export function createPatchPlugin(platform: ModPlatform): ConfigPlugin {
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  const pluginName = `with${platformName}PatchPlugin`;
  const withUnknown: ConfigPlugin = (config) => {
    return withRunOnce(config, {
      plugin: (config) => withPatchMod(config, platform),
      name: pluginName,
    });
  };
  Object.defineProperty(withUnknown, 'name', {
    value: pluginName,
  });
  return withUnknown;
}

async function determinePatchFilePathAsync(
  projectRoot: string,
  platform: ModPlatform,
  templateChecksum: string,
  props: PatchPluginProps
): Promise<string | null> {
  const patchRoot = path.join(projectRoot, props.patchRoot);
  let patchFilePath = path.join(patchRoot, `${platform}+${templateChecksum}.patch`);

  const patchFiles = await getPatchFilesAsync(patchRoot, platform, props);
  let patchExists = patchFiles.includes(path.basename(patchFilePath));
  if (patchFiles.length > 0 && !patchExists) {
    const firstPatchFilePath = path.join(patchRoot, patchFiles[0]);
    addWarningForPlatform(
      platform,
      'withPatchPlugin',
      `Having patch files in ${patchRoot} but none matching "${patchFilePath}", using "${firstPatchFilePath}" instead.`
    );
    patchFilePath = firstPatchFilePath;
    patchExists = true;
  } else if (patchFiles.length > 1) {
    addWarningForPlatform(
      platform,
      'withPatchPlugin',
      `Having multiple patch files in ${patchRoot} is not supported. Only matched patch file "${patchFilePath}" will be applied.`
    );
  }

  if (EXPO_DEBUG) {
    console.log(
      patchExists
        ? `[withPatchPlugin] Applying patch from ${patchFilePath}`
        : `[WithPatchPlugin] No patch found: ${patchFilePath}`
    );
  }
  if (!patchExists) {
    return null;
  }
  return patchFilePath;
}

async function getPatchFilesAsync(
  patchRoot: string,
  platform: ModPlatform,
  props: PatchPluginProps
): Promise<string[]> {
  return await new Promise<string[]>((resolve, reject) => {
    glob(`${platform}*.patch`, { cwd: patchRoot }, (error, matches) => {
      if (error) {
        reject(error);
      } else {
        resolve(matches);
      }
    });
  });
}

function createPropsFromConfig(config: ExpoConfig): PatchPluginProps {
  const patchPluginConfig =
    config.plugins?.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'withPatchPlugin'
    )?.[1] ?? {};
  return {
    patchRoot: patchPluginConfig.patchRoot ?? 'cng-patches',
    changedLinesLimit: patchPluginConfig.changedLinesLimit ?? 300,
  };
}
