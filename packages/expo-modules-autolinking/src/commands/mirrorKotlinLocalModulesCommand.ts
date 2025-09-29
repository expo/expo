import commander from 'commander';
import fs from 'fs';
import path from 'path';

import { AutolinkingCommonArguments, registerAutolinkingArguments } from './autolinkingOptions';
import {
  createSymlinksToKotlinFiles,
  generateLocalModulesListFile,
} from '../localModules/androidLocalModules';
interface ResolveArguments extends AutolinkingCommonArguments {
  json?: boolean | null;
}

export function mirrorKotlinLocalModulesCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(
    cli.command(
      'mirror-kotlin-local-modules <kotlinFilesMirrorDirectory> <localModulesListPath> <watchedDirsSerialized>'
    )
  ).action(
    async (
      kotlinFilesMirrorDirectory: string,
      localModulesListPath: string,
      watchedDirsSerialized: string
    ) => {
      const watchedDirs = JSON.parse(watchedDirsSerialized);
      if (!kotlinFilesMirrorDirectory || !localModulesListPath) {
        throw new Error('Need to provide kotlinFilesMirrorDirectory and localModulesListPath!');
      }
      if (
        !/.android./.test(kotlinFilesMirrorDirectory) ||
        !/.android./.test(localModulesListPath)
      ) {
        throw new Error('Generation path is not inside any android directory!');
      }
      if (!path.isAbsolute(kotlinFilesMirrorDirectory) || !path.isAbsolute(localModulesListPath)) {
        throw new Error(
          'Need to provide the absolute path to both the local modules src mirror and generated mirror directory!'
        );
      }

      fs.rmSync(kotlinFilesMirrorDirectory, { recursive: true, force: true });
      await createSymlinksToKotlinFiles(kotlinFilesMirrorDirectory, watchedDirs);
      await generateLocalModulesListFile(localModulesListPath, watchedDirs);
    }
  );
}
