import { styleText } from 'node:util';

import { getAndroidProjectReports, Revision } from './androidProjectReports';
import { promptForNativeDependenciesUpdates, promptForAndroidProjectsSelection } from './prompts';
import { AndroidProjectReport, GradleDependency } from './types';
import { addChangelogEntries } from './updateChangelogFiles';
import { updateGradleDependencies } from './updateGradleFiles';
import { addColorBasedOnSemverDiff, calculateSemverDiff, getChangelogLink } from './utils';
import logger from '../Logger';

async function printAvailableUpdates(reports: AndroidProjectReport[]) {
  const printDependency = (dependency: GradleDependency) => {
    logger.log(
      `    ▶︎ ${dependency.fullName}:${dependency.currentVersion} ➡️  ${addColorBasedOnSemverDiff(
        dependency.availableVersion,
        calculateSemverDiff(dependency.currentVersion, dependency.availableVersion)
      )} ${getChangelogLink(dependency.fullName, dependency.projectUrl)}`
    );
  };

  for (const {
    projectName,
    gradleReport: { exceeded, unresolved, outdated },
  } of reports) {
    const unresolvedExceededDependencies = [...unresolved, ...exceeded];
    const noDependenciesIssues = unresolvedExceededDependencies.length + outdated.length === 0;

    logger.log(
      `\n● Project: ${styleText('blue', projectName)}${
        noDependenciesIssues ? styleText('green', ` - no dependencies issues ✅`) : ''
      }`
    );

    if (outdated.length > 0) {
      logger.log(styleText('cyan', '  ◼︎ outdated dependencies:'));
      outdated.forEach(printDependency);
    }

    if (unresolvedExceededDependencies.length > 0) {
      logger.log(styleText('yellow', '  ◼︎ unresolved/exceeded dependencies:'));
      unresolvedExceededDependencies.forEach(printDependency);
    }
  }
}

export interface Options {
  revision: Revision;
  list: boolean;
  clearCache: boolean;
  platform: string;
}

export default async function androidUpdateNativeDependencies(options: Options) {
  const reports = await getAndroidProjectReports(options);
  if (options.list) {
    return await printAvailableUpdates(reports);
  }
  const selectedReports = await promptForAndroidProjectsSelection(reports);
  const selectedDependenciesUpdates = await promptForNativeDependenciesUpdates(selectedReports);
  await updateGradleDependencies(selectedDependenciesUpdates);
  await addChangelogEntries(selectedDependenciesUpdates);
}
