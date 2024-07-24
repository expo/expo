import {
  WarningAggregator,
  withFinalizedMod,
  withRunOnce,
  type ConfigPlugin,
  type ModPlatform,
} from 'expo/config-plugins';
import { glob as globAsync } from 'glob';
import path from 'path';

import * as env from './env';
import { applyPatchAsync, getPatchChangedLinesAsync } from './gitPatch';

const DEFAULT_PATCH_ROOT = 'cng-patches';
const DEFAULT_CHANGED_LINES_LIMIT = 300;

interface PatchPluginProps {
  /** The directory to search for patch files in. */
  patchRoot?: string;
  /** The maximum changed lines allowed in the patch file, if exceeded the patch will show a warning. */
  changedLinesLimit?: number;
}

export const withPatchPlugin: ConfigPlugin<PatchPluginProps | undefined> = (config, props) => {
  config = createPatchPlugin('android', props)(config);
  config = createPatchPlugin('ios', props)(config);
  return config;
};

export default withPatchPlugin;

const withPatchMod: ConfigPlugin<{ platform: ModPlatform; props: PatchPluginProps | undefined }> = (
  config,
  { platform, props }
) => {
  return withFinalizedMod(config, [
    platform,
    async (config) => {
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
        const changedLinesLimit = props?.changedLinesLimit ?? DEFAULT_CHANGED_LINES_LIMIT;
        if (changedLines > changedLinesLimit) {
          WarningAggregator.addWarningForPlatform(
            platform,
            'withPatchPlugin',
            `The patch file "${patchFilePath}" has ${changedLines} changed lines, which exceeds the limit of ${changedLinesLimit}.`
          );
        }

        await applyPatchAsync(projectRoot, patchFilePath);
      }
      return config;
    },
  ]);
};

function createPatchPlugin(
  platform: ModPlatform,
  props: PatchPluginProps | undefined
): ConfigPlugin {
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  const pluginName = `with${platformName}PatchPlugin`;
  const withUnknown: ConfigPlugin = (config) => {
    return withRunOnce(config, {
      plugin: (config) => withPatchMod(config, { platform, props }),
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
  props: PatchPluginProps | undefined
): Promise<string | null> {
  const patchRoot = path.join(projectRoot, props?.patchRoot ?? DEFAULT_PATCH_ROOT);
  const patchFilePath = path.join(patchRoot, `${platform}+${templateChecksum}.patch`);

  const patchFiles = await getPatchFilesAsync(patchRoot, platform);
  const patchExists = patchFiles.includes(path.basename(patchFilePath));
  if (patchFiles.length > 0 && !patchExists) {
    const firstPatchFilePath = path.join(patchRoot, patchFiles[0]);
    WarningAggregator.addWarningForPlatform(
      platform,
      'withPatchPlugin',
      `Having patch files in ${patchRoot} but none matching "${patchFilePath}", using "${firstPatchFilePath}" instead.`
    );
  } else if (patchFiles.length > 1) {
    WarningAggregator.addWarningForPlatform(
      platform,
      'withPatchPlugin',
      `Having multiple patch files in ${patchRoot} is not supported. Only matched patch file "${patchFilePath}" will be applied.`
    );
  }

  if (env.EXPO_DEBUG) {
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

async function getPatchFilesAsync(patchRoot: string, platform: ModPlatform): Promise<string[]> {
  return await globAsync(`${platform}*.patch`, { cwd: patchRoot });
}
