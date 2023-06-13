import { ExpoConfig, PackageJSONConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';
import chalk from 'chalk';

import * as Log from '../log';
import { AbortCommandError, SilentError } from '../utils/errors';
import { logNewSection } from '../utils/ora';
import { profile } from '../utils/profile';
import { copyTemplateFilesAsync, createCopyFilesSuccessMessage } from './copyTemplateFiles';
import { cloneTemplateAsync } from './resolveTemplate';
import { DependenciesModificationResults, updatePackageJSONAsync } from './updatePackageJson';
import { validateTemplatePlatforms } from './validateTemplatePlatforms';

/**
 * Creates local native files from an input template file path.
 *
 * @return `true` if the project is ejecting, and `false` if it's syncing.
 */
export async function updateFromTemplateAsync(
  projectRoot: string,
  {
    exp,
    pkg,
    template,
    templateDirectory,
    platforms,
    skipDependencyUpdate,
  }: {
    /** Expo Config */
    exp: ExpoConfig;
    /** package.json as JSON */
    pkg: PackageJSONConfig;
    /** Template reference ID. */
    template?: string;
    /** Directory to write the template to before copying into the project. */
    templateDirectory?: string;
    /** List of platforms to clone. */
    platforms: ModPlatform[];
    /** List of dependencies to skip updating. */
    skipDependencyUpdate?: string[];
  }
): Promise<
  {
    /** Indicates if new files were created in the project. */
    hasNewProjectFiles: boolean;
    /** Indicates that the project needs to run `pod install` */
    needsPodInstall: boolean;
  } & DependenciesModificationResults
> {
  if (!templateDirectory) {
    const temporary = await import('tempy');
    templateDirectory = temporary.directory();
  }

  const copiedPaths = await profile(cloneTemplateAndCopyToProjectAsync)({
    projectRoot,
    template,
    templateDirectory,
    exp,
    platforms,
  });

  const depsResults = await profile(updatePackageJSONAsync)(projectRoot, {
    templateDirectory,
    pkg,
    skipDependencyUpdate,
  });

  return {
    hasNewProjectFiles: !!copiedPaths.length,
    // If the iOS folder changes or new packages are added, we should rerun pod install.
    needsPodInstall:
      copiedPaths.includes('ios') ||
      depsResults.hasNewDependencies ||
      depsResults.hasNewDevDependencies,
    ...depsResults,
  };
}

/**
 * Extract the template and copy the ios and android directories over to the project directory.
 *
 * @return `true` if any project files were created.
 */
async function cloneTemplateAndCopyToProjectAsync({
  projectRoot,
  templateDirectory,
  template,
  exp,
  platforms: unknownPlatforms,
}: {
  projectRoot: string;
  templateDirectory: string;
  template?: string;
  exp: Pick<ExpoConfig, 'name' | 'sdkVersion'>;
  platforms: ModPlatform[];
}): Promise<string[]> {
  const ora = logNewSection(
    'Creating native project directories (./ios and ./android) and updating .gitignore'
  );

  try {
    await cloneTemplateAsync({ templateDirectory, template, exp, ora });

    const platforms = await validateTemplatePlatforms({
      templateDirectory,
      platforms: unknownPlatforms,
    });

    const results = await copyTemplateFilesAsync(projectRoot, {
      templateDirectory,
      platforms,
    });

    ora.succeed(createCopyFilesSuccessMessage(platforms, results));

    return results.copiedPaths;
  } catch (e: any) {
    if (!(e instanceof AbortCommandError)) {
      Log.error(e.message);
    }
    ora.fail('Failed to create the native project.');
    Log.log(
      chalk.yellow(
        'You may want to delete the `./ios` and/or `./android` directories before trying again.'
      )
    );
    throw new SilentError(e);
  }
}
