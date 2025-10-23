import commander from 'commander';
import fs from 'fs';
import path from 'path';

import { registerAutolinkingArguments } from './autolinkingOptions';
import {
  createSymlinksToKotlinFiles,
  generateInlineModulesListFile,
} from '../inlineModules/androidInlineModules';

export function mirrorKotlinInlineModulesCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(
    cli.command(
      'mirror-kotlin-inline-modules <kotlinFilesMirrorDirectory> <inlineModulesListPath> <watchedDirectoriesSerialized>'
    )
  ).action(
    async (
      kotlinFilesMirrorDirectory: string,
      inlineModulesListPath: string,
      watchedDirectoriesSerialized: string
    ) => {
      const watchedDirectories = JSON.parse(watchedDirectoriesSerialized);
      if (!kotlinFilesMirrorDirectory || !inlineModulesListPath) {
        throw new Error('Need to provide kotlinFilesMirrorDirectory and inlineModulesListPath!');
      }
      if (
        !/.android./.test(kotlinFilesMirrorDirectory) ||
        !/.android./.test(inlineModulesListPath)
      ) {
        throw new Error('Generation path is not inside any android directory!');
      }
      if (!path.isAbsolute(kotlinFilesMirrorDirectory) || !path.isAbsolute(inlineModulesListPath)) {
        throw new Error(
          'Need to provide the absolute path to both the local modules src mirror and generated mirror directory!'
        );
      }

      fs.rmSync(kotlinFilesMirrorDirectory, { recursive: true, force: true });
      await createSymlinksToKotlinFiles(kotlinFilesMirrorDirectory, watchedDirectories);
      await generateInlineModulesListFile(inlineModulesListPath, watchedDirectories);
    }
  );
}
