import type commander from 'commander';
import fs from 'fs';
import path from 'path';

import {
  createSymlinksToKotlinFiles,
  generateInlineModulesListFile,
} from '../inlineModules/androidInlineModules';
import type { KotlinPackageHeaderLength } from '../inlineModules/inlineModules';
import { getMirrorStateObject } from '../inlineModules/inlineModules';
import type { AutolinkingCommonArguments } from './autolinkingOptions';
import { createAutolinkingOptionsLoader, registerAutolinkingArguments } from './autolinkingOptions';

interface MirrorKotlinInlineModulesCommandArguments extends AutolinkingCommonArguments {
  kotlinFilesMirrorDirectory: string;
  inlineModulesListDirectory: string;
  watchedDirectoriesSerialized: string;
  kotlinPackageHeaderLength: string;
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
    .requiredOption(
      '--watched-directories-serialized <watchedDirectories>',
      'JSON serialized watched directories array'
    )
    .requiredOption(
      '--kotlin-package-header-length <kotlinPackageHeaderLength>',
      "Number of bytes read from the start of a Kotlin file to find its package declaration, or 'WHOLE_FILE'"
    )
    .action(async (commandArguments: MirrorKotlinInlineModulesCommandArguments) => {
      const {
        kotlinFilesMirrorDirectory,
        inlineModulesListDirectory,
        watchedDirectoriesSerialized,
        kotlinPackageHeaderLength: kotlinPackageHeaderLengthSerialized,
      } = commandArguments;
      const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
        ...commandArguments,
      });
      const appRoot = await autolinkingOptionsLoader.getAppRoot();
      const watchedDirectories = JSON.parse(watchedDirectoriesSerialized);
      const kotlinPackageHeaderLength: KotlinPackageHeaderLength =
        kotlinPackageHeaderLengthSerialized === 'WHOLE_FILE'
          ? 'WHOLE_FILE'
          : Number(kotlinPackageHeaderLengthSerialized);

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

      const inlineModulesMirror = await getMirrorStateObject({
        watchedDirectories,
        appRoot,
        kotlinPackageHeaderLength,
      });

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
