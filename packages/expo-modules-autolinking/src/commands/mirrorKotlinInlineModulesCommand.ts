import type commander from 'commander';
import fs from 'fs';
import path from 'path';

import {
  createSymlinksToKotlinFiles,
  generateInlineModulesListFile,
} from '../inlineModules/androidInlineModules';
import { getMirrorStateObject } from '../inlineModules/inlineModules';
import type { AutolinkingCommonArguments } from './autolinkingOptions';
import { createAutolinkingOptionsLoader, registerAutolinkingArguments } from './autolinkingOptions';

interface MirrorKotlinInlineModulesCommandArguments extends AutolinkingCommonArguments {
  kotlinFilesMirrorDirectory: string;
  inlineModulesListDirectory: string;
  watchedDirectory: string[];
}

/**
 * A cli command which:
 * - creates InlineModulesList.kt file
 * - mirrors directory structure of watched directories
 * - symlinks the original kotlin files in the new mirror directories.
 */
export function mirrorKotlinInlineModulesCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('mirror-kotlin-inline-modules'))
    .requiredOption(
      '--kotlin-files-mirror-directory <path>',
      'Directory in which to create mirrors of watched directories'
    )
    .requiredOption(
      '--inline-modules-list-directory <path>',
      'Path to the directory in which to generate the inlineModulesList file.'
    )
    .option<string[]>(
      '--watched-directory <path>',
      'Directory watched for inline modules. Repeat the option for each directory.',
      (value, previous) => previous.concat(value),
      []
    )
    .action(async (commandArguments: MirrorKotlinInlineModulesCommandArguments) => {
      const {
        kotlinFilesMirrorDirectory,
        inlineModulesListDirectory,
        watchedDirectory: watchedDirectories,
      } = commandArguments;
      const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
        ...commandArguments,
      });
      const appRoot = await autolinkingOptionsLoader.getAppRoot();

      if (
        !/.android./.test(kotlinFilesMirrorDirectory) ||
        !/.android./.test(inlineModulesListDirectory)
      ) {
        throw new Error('Generation path is not inside any android directory!');
      }

      if (
        !path.isAbsolute(kotlinFilesMirrorDirectory) ||
        !path.isAbsolute(inlineModulesListDirectory)
      ) {
        throw new Error(
          'Need to provide the absolute path to both the kotlin files mirror and inline modules list directories!'
        );
      }

      const inlineModulesMirror = await getMirrorStateObject({ watchedDirectories, appRoot });

      const createMirrorStructurePromise = fs.promises
        .rm(kotlinFilesMirrorDirectory, { recursive: true, force: true })
        .then(() => createSymlinksToKotlinFiles(kotlinFilesMirrorDirectory, inlineModulesMirror));

      const generateInlineModulesListPromise = generateInlineModulesListFile(
        inlineModulesListDirectory,
        inlineModulesMirror
      );
      await Promise.all([createMirrorStructurePromise, generateInlineModulesListPromise]);
    });
}
