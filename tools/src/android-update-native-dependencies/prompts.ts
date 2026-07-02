import inquirer from 'inquirer';
import { styleText } from 'node:util';
import type { ReleaseType } from 'semver';
import stripAnsi from 'strip-ansi';

import {
  AndroidProjectDependenciesUpdates,
  AndroidProjectReport,
  GradleDependency,
  GradleDependencyUpdate,
} from './types';
import { addColorBasedOnSemverDiff, calculateSemverDiff, getChangelogLink } from './utils';
import logger from '../Logger';

function generateAndroidProjectsSelectionChoice({
  projectName,
  gradleReport: { outdated, exceeded, unresolved },
}: AndroidProjectReport) {
  const deprecationMarking =
    outdated.length > 0 ? ` ${styleText('yellow', `(${outdated.length} ⚠️ )`)}` : '';
  const hasUnresolvedOrExceedeedMarking =
    exceeded.length > 0 || unresolved.length > 0
      ? ` ${styleText('red', `(${exceeded.length + unresolved.length} ❗️)`)}`
      : '';
  const name = `${projectName}${deprecationMarking}${hasUnresolvedOrExceedeedMarking}`;
  return {
    name,
    value: projectName,
    checked: outdated.length > 0 || exceeded.length > 0 || unresolved.length > 0,
  };
}

export async function promptForAndroidProjectsSelection(
  reports: AndroidProjectReport[]
): Promise<AndroidProjectReport[]> {
  const { selectedProjects } = await inquirer.prompt<{ selectedProjects: string[] }>([
    {
      type: 'checkbox',
      name: 'selectedProjects',
      message: `Choose which projects need updates. ${styleText('yellow', '(<number> ⚠️ )')} shows how many dependencies are outdated. ${styleText('red', '(<number> ❗️)')} shows other problems with respective project's dependencies.`,
      choices: reports.map(generateAndroidProjectsSelectionChoice),
      pageSize: Math.min(reports.length, (process.stdout.rows || 100) - 2),
    },
  ]);
  return reports.filter(({ projectName }) => selectedProjects.includes(projectName));
}

async function promptForDependenciesVersions(
  dependencies: GradleDependency[]
): Promise<GradleDependencyUpdate[]> {
  const updates: GradleDependencyUpdate[] = [];

  const sortedDependencies = dependencies.sort((a, b) => a.fullName.localeCompare(b.fullName));
  for (const dependency of sortedDependencies) {
    logger.log(
      `  ▶︎ ${styleText('blueBright', dependency.fullName)} ${getChangelogLink(
        dependency.fullName,
        dependency.projectUrl
      )}`
    );
    const semverDiff = calculateSemverDiff(dependency.currentVersion, dependency.availableVersion);
    const version = await promptForDependencyVersion(dependency, semverDiff);
    if (version !== false) {
      updates.push({
        name: dependency.name,
        group: dependency.group,
        fullName: dependency.fullName,
        oldVersion: dependency.currentVersion,
        newVersion: stripAnsi(version),
      });
    }
  }

  return updates;
}

async function promptForDependencyVersion(
  dependency: GradleDependency,
  semverDiff: ReleaseType | null
) {
  let version = (
    await inquirer.prompt<{ version: string | boolean }>([
      {
        type: 'list',
        name: 'version',
        message: `Choose version to update to:`,
        choices: [
          {
            name: `Latest version – (${addColorBasedOnSemverDiff(
              dependency.availableVersion,
              semverDiff
            )})`,
            value: dependency.availableVersion,
          },
          {
            name: `Don't update – (${dependency.currentVersion})`,
            value: false,
          },
          {
            name: `Different version – will ask in the next step`,
            value: true,
          },
        ],
        default: 0,
        prefix: `  ${styleText('green', '?')}`,
      },
    ])
  ).version;
  if (version === true) {
    version = (
      await inquirer.prompt<{ version: string }>([
        {
          type: 'input',
          name: 'version',
          message: `${dependency.fullName}:${dependency.currentVersion} ➡️ `,
          default: addColorBasedOnSemverDiff(dependency.availableVersion, semverDiff),
          prefix: `  ${styleText('green', '?')}`,
        },
      ])
    ).version;
  }
  return version;
}

async function promptForDependenciesUpdatesSelection(
  report: AndroidProjectReport
): Promise<GradleDependencyUpdate[]> {
  const result: GradleDependencyUpdate[] = [];

  logger.log(`\n● project: ${styleText('blue', report.projectName)}`);
  result.push(...(await promptForDependenciesVersions(report.gradleReport.outdated)));

  if (report.gradleReport.exceeded.length > 0) {
    logger.log(`🧐 these dependencies ${styleText('yellow', 'exceed')} available version:`);
    result.push(...(await promptForDependenciesVersions(report.gradleReport.exceeded)));
  }
  if (report.gradleReport.unresolved.length > 0) {
    logger.log(`💥 ${styleText('red', 'Failed to resolve')} these dependencies:`);
    result.push(...(await promptForDependenciesVersions(report.gradleReport.unresolved)));
  }

  return result;
}

export async function promptForNativeDependenciesUpdates(
  reports: AndroidProjectReport[]
): Promise<AndroidProjectDependenciesUpdates[]> {
  const selectedDependenciesUpdates: AndroidProjectDependenciesUpdates[] = [];
  logger.log(
    styleText(
      ['white', 'bold'],
      '\nProvide new native dependencies versions for each project. Check their changes in respective CHANGELOGs. To skip dependency provide no value.'
    )
  );
  for (const report of reports) {
    const updates = await promptForDependenciesUpdatesSelection(report);
    if (updates.length > 0) {
      selectedDependenciesUpdates.push({
        report,
        updates,
      });
    }
  }
  return selectedDependenciesUpdates;
}
