import spawnAsync from '@expo/spawn-async';
import { boolish } from 'getenv';
import { glob } from 'glob';
import path from 'path';

import { withMod } from './withMod';
import { withRunOnce } from './withRunOnce';
import type { ConfigPlugin, ModPlatform } from '../Plugin.types';
import { addWarningForPlatform } from '../utils/warnings';

const DEFAULT_PATCH_ROOT = 'cng-patches';
const EXPO_DEBUG = boolish('EXPO_DEBUG', false);

export interface PatchPluginProps {
  /** The directory to search for patch files in. */
  patchRoot?: string;
}

const withPatchMod: ConfigPlugin<[ModPlatform, PatchPluginProps]> = (config, [platform, props]) => {
  return withMod(config, {
    platform,
    mod: 'patch',
    action: async (config) => {
      const templateChecksum = config._internal?.templateChecksum ?? '';
      await applyPatchAsync(config.modRequest.projectRoot, platform, templateChecksum, props);
      return config;
    },
  });
};

export function createPatchPlugin(
  platform: ModPlatform,
  props: PatchPluginProps = {}
): ConfigPlugin {
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  const pluginName = `with${platformName}PatchPlugin`;
  const withUnknown: ConfigPlugin = (config) => {
    return withRunOnce(config, {
      plugin: (config) => withPatchMod(config, [platform, props]),
      name: pluginName,
    });
  };
  Object.defineProperty(withUnknown, 'name', {
    value: pluginName,
  });
  return withUnknown;
}

async function applyPatchAsync(
  projectRoot: string,
  platform: ModPlatform,
  templateChecksum: string,
  props: PatchPluginProps
) {
  const patchRoot = path.join(projectRoot, props.patchRoot ?? DEFAULT_PATCH_ROOT);
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
    return;
  }
  try {
    const { stdout, stderr } = await spawnAsync('git', ['apply', patchFilePath], {
      cwd: projectRoot,
    });
    if (EXPO_DEBUG) {
      console.log(`[withPatchPlugin] outputs\nstdout:\n${stdout}\nstderr:\n${stderr}`);
    }
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      e.message += `\nGit is required to apply patches. Install Git and try again.`;
    } else if (e.stderr) {
      e.message += `\nstderr:\n${e.stderr}`;
    }
    throw e;
  }
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
