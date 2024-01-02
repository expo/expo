import spawnAsync from '@expo/spawn-async';
import { boolish } from 'getenv';
import path from 'path';

import { withMod } from './withMod';
import { withRunOnce } from './withRunOnce';
import type { ConfigPlugin, ModPlatform } from '../Plugin.types';
import { fileExistsAsync } from '../utils/modules';

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
      await applyPatchAsync(config.modRequest.projectRoot, platform, props);
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
  props: PatchPluginProps
) {
  const patchFilePath = path.join(
    projectRoot,
    props.patchRoot ?? DEFAULT_PATCH_ROOT,
    `${platform}.patch`
  );
  const patchExists = await fileExistsAsync(patchFilePath);
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
