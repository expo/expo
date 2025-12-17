import chalk from 'chalk';
import semver, { type ReleaseType } from 'semver';
import terminalLink from 'terminal-link';

import { EXPOTOOLS_DIR } from '../Constants';
import dependenciesChangelogs from '../data/androidDependenciesChangelogs.json';

export function getChangelogLink(dependency: string, fallbackLink: string | null) {
  const link = dependenciesChangelogs[dependency] ?? fallbackLink;
  return chalk.italic.dim(
    (link && terminalLink('CHANGELOG', link)) ??
      chalk.whiteBright(
        `Hey developer! Add CHANGELOG URL address for this dependency in ${terminalLink(
          'dependenciesChangelogs.json',
          `file://${EXPOTOOLS_DIR}/src/android-update-native-dependencies/dependenciesChangelogs.json`
        )}!`
      )
  );
}

export function calculateSemverDiff(from: string, to: string | null): ReleaseType | null {
  if (!to) {
    return null;
  }
  try {
    const semverDiff = semver.diff(from, to);
    return semverDiff;
  } catch {
    return null;
  }
}

export function addColorBasedOnSemverDiff(version: string | null, semverDiff: ReleaseType | null) {
  let colorEffect: 'green' | 'yellow' | 'red' | 'reset' | 'bgRedBright' = 'bgRedBright';
  if (semverDiff) {
    if (['patch', 'prepatch'].includes(semverDiff)) {
      colorEffect = 'green';
    } else if (['minor', 'preminor'].includes(semverDiff)) {
      colorEffect = 'yellow';
    } else if (['major', 'premajor'].includes(semverDiff)) {
      colorEffect = 'red';
    }
  }

  return chalk.reset.bold[colorEffect](version ?? '<unknown>');
}
