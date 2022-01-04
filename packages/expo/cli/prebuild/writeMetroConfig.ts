import { PackageJSONConfig } from '@expo/config';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import * as Log from '../log';
import { CommandError } from '../utils/errors';
import { logNewSection } from '../utils/ora';
import { learnMore } from '../utils/TerminalLink';
import { createFileHash } from './updatePackageJson';

export function writeMetroConfig({
  projectRoot,
  pkg,
  tempDir,
}: {
  projectRoot: string;
  pkg: PackageJSONConfig;
  tempDir: string;
}) {
  /**
   * Add metro config, or warn if metro config already exists. The developer will need to add the
   * hashAssetFiles plugin manually.
   */

  const updatingMetroConfigStep = logNewSection('Adding Metro bundler config');

  try {
    const sourceConfigPath = path.join(tempDir, 'metro.config.js');
    const targetConfigPath = path.join(projectRoot, 'metro.config.js');
    const targetConfigPathExists = fs.existsSync(targetConfigPath);
    if (targetConfigPathExists) {
      // Prevent re-runs from throwing an error if the metro config hasn't been modified.
      const contents = createFileHash(fs.readFileSync(targetConfigPath, 'utf8'));
      const targetContents = createFileHash(fs.readFileSync(sourceConfigPath, 'utf8'));
      if (contents !== targetContents) {
        throw new CommandError('Existing Metro config found; not overwriting.');
      } else {
        // Nothing to change, hide the step and exit.
        updatingMetroConfigStep.stop();
        updatingMetroConfigStep.clear();
        return;
      }
    } else if (
      fs.existsSync(path.join(projectRoot, 'metro.config.json')) ||
      pkg.metro ||
      fs.existsSync(path.join(projectRoot, 'rn-cli.config.js'))
    ) {
      throw new CommandError('Existing Metro config found; not overwriting.');
    }

    fs.copySync(sourceConfigPath, targetConfigPath);
    updatingMetroConfigStep.succeed('Added Metro config');
  } catch (e) {
    updatingMetroConfigStep.stopAndPersist({
      symbol: '⚠️ ',
      text: chalk.yellow('Skipped Metro config updates:'),
    });
    Log.nested(`\u203A ${e.message}`);
    Log.nested(
      `\u203A You will need to extend the default ${chalk.bold(
        '@expo/metro-config'
      )} in your Metro config.\n  ${Log.chalk.dim(
        learnMore('https://docs.expo.dev/guides/customizing-metro')
      )}`
    );
    Log.newLine();
  }
}
