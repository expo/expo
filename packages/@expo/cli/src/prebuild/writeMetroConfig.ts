import { PackageJSONConfig } from '@expo/config';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import * as Log from '../log';
import { CommandError } from '../utils/errors';
import { learnMore } from '../utils/link';
import { logNewSection } from '../utils/ora';
import { createFileHash } from './updatePackageJson';

export function writeMetroConfig(
  projectRoot: string,
  {
    pkg,
    templateDirectory,
  }: {
    pkg: PackageJSONConfig;
    templateDirectory: string;
  }
) {
  /**
   * Add metro config, or warn if metro config already exists. The developer will need to add the
   * hashAssetFiles plugin manually.
   */

  const updatingMetroConfigStep = logNewSection('Adding Metro bundler config');

  try {
    const didChange = copyTemplateMetroConfig(projectRoot, { pkg, templateDirectory });
    if (!didChange) {
      // Nothing to change, hide the step and exit.
      updatingMetroConfigStep.stop();
      updatingMetroConfigStep.clear();
      return;
    }
    updatingMetroConfigStep.succeed('Added Metro config');
  } catch (error: any) {
    updatingMetroConfigStep.stopAndPersist({
      symbol: chalk.yellow('›'),
      text: chalk.yellow(chalk`{bold Skipped updating Metro config:} ${error.message}`),
    });
    // Log.log(`\u203A ${e.message}`);
    Log.log(
      chalk`\u203A {dim ${learnMore('https://docs.expo.dev/guides/customizing-metro')}}`
    );
  }
}

/**
 * Detects if the project's existing `metro.config.js` matches the template, and if not,
 * throws errors indicating what the user should do.
 *
 * > Exposed for testing.
 *
 * @returns Boolean indicating the `metro.config.js` changed.
 */
export function copyTemplateMetroConfig(
  projectRoot: string,
  {
    pkg,
    templateDirectory,
  }: {
    pkg: PackageJSONConfig;
    templateDirectory: string;
  }
): boolean {
  const sourceConfigPath = path.join(templateDirectory, 'metro.config.js');
  const targetConfigPath = path.join(projectRoot, 'metro.config.js');
  const targetConfigPathExists = fs.existsSync(targetConfigPath);
  if (targetConfigPathExists) {
    // Prevent re-runs from throwing an error if the metro config hasn't been modified.
    const contents = createFileHash(fs.readFileSync(targetConfigPath, 'utf8'));
    const targetContents = createFileHash(fs.readFileSync(sourceConfigPath, 'utf8'));
    if (contents !== targetContents) {
      throw new CommandError('Project metro.config.js does not match prebuild template.');
    }
    return false;
  }

  // We don't support legacy file names so just throw.
  if (
    fs.existsSync(path.join(projectRoot, 'metro.config.json')) ||
    pkg.metro ||
    fs.existsSync(path.join(projectRoot, 'rn-cli.config.js'))
  ) {
    throw new CommandError(
      'Project is using a legacy config system that cannot be extend automatically.'
    );
  }

  // Finally, copy if nothing goes wrong.
  fs.copyFileSync(sourceConfigPath, targetConfigPath);

  return true;
}
