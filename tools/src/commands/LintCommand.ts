import { Command } from '@expo/commander';
import semver from 'semver';

import * as SwiftLint from '../linting/SwiftLint';

type ActionOptions = {
  fix: boolean;
};

const MIN_SWIFTLINT_VERSION = '0.44.0';

async function action(paths: string[], options: ActionOptions) {
  const version = await SwiftLint.getVersionAsync();

  if (!version) {
    throw new Error(
      'SwiftLint is not installed. Install it with Homebrew: https://github.com/realm/SwiftLint#using-homebrew'
    );
  }
  if (semver.lt(version, MIN_SWIFTLINT_VERSION)) {
    throw new Error(`Version ${version} is not supported, use at least ${MIN_SWIFTLINT_VERSION}`);
  }

  console.log(
    await SwiftLint.lintAsync(['packages/expo-dev-menu/ios/Modules/DevMenuExtensions.swift'])
  );
}

export default (program: Command) => {
  program
    .command('lint [paths...]')
    .description('Lints the source files to detect stylistic or programmatic errors. (Swift only)')
    .option('-f, --fix', 'Whether to fix issues, if possible.')
    .asyncAction(action);
};
