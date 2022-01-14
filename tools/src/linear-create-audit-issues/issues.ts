import chalk from 'chalk';

import { Package } from '../Packages';
import Configuration from './Configuration';
import linearClient from './LinearClient';
import { getUmbrellaIssue, getIssue, getTeam, getProject, getLabel } from './linearCache';
import { getNpmDownloadStats, isSchedulesForDeprecation, withSpinner } from './helpers';
import { NpmDownloadStats } from '../Npm';

const updateUmbrellaIssue = withSpinner(`Updating umbrella issue`, async () => {
  const umbrellaIssue = getUmbrellaIssue();
  await linearClient.issueUpdate(umbrellaIssue.id, {
    title: Configuration.umbrellaIssue.title,
    description: Configuration.umbrellaIssue.description,
    teamId: getTeam(Configuration.teamName).id,
    projectId: getProject(Configuration.projectName).id,
    labelIds: Configuration.umbrellaIssue.labelNames.map((labelName) => getLabel(labelName).id),
  });
});

async function createOrUpdateIssue({
  teamName,
  title,
  description,
  labelNames,
  parentIssueId: parentId,
  projectName,
  sortOrderInParentIssue,
}: {
  teamName: string;
  title: string;
  description: string;
  labelNames: string[];
  parentIssueId: string;
  projectName: string;
  sortOrderInParentIssue?: number;
}) {
  const currentIssue = getIssue(title);
  const payload = {
    title,
    description,
    parentId,
    teamId: getTeam(teamName).id,
    projectId: getProject(projectName).id,
    labelIds: labelNames.map((labelName) => getLabel(labelName).id),
    subIssueSortOrder: sortOrderInParentIssue,
  };

  if (currentIssue) {
    return linearClient.issueUpdate(currentIssue.id, payload);
  }

  return linearClient.issueCreate(payload);
}

const createOrUpdateIssuesForPackage = (
  pkg: Package,
  downloadStats: NpmDownloadStats,
  orderInParentIssue: number,
  packagesCount: number
) =>
  withSpinner(
    `Creating or updating issue for ${chalk.bold.cyanBright(pkg.packageName)} (${Math.floor(
      downloadStats.byTimePeriods['last-month'] / 1000
    )}k/month) (${orderInParentIssue + 1}/${packagesCount})`,
    async () => {
      const deprecated = isSchedulesForDeprecation(pkg.packageName);
      const umbrellaIssue = getUmbrellaIssue();

      const { title, description, childIssueTemplates, labelNames } = deprecated
        ? Configuration.umbrellaIssue.deprecatedChildIssueTemplate
        : Configuration.umbrellaIssue.childIssueTemplate;

      const parentIssuePayload = await createOrUpdateIssue({
        title: title(pkg.packageName, downloadStats),
        description: description(pkg.packageName, downloadStats),
        teamName: Configuration.teamName,
        projectName: Configuration.projectName,
        labelNames: labelNames,
        parentIssueId: umbrellaIssue.id,
        sortOrderInParentIssue: orderInParentIssue,
      });

      if (!parentIssuePayload.issue || !parentIssuePayload.success) {
        throw new Error(`Failed to create issue for ${pkg.packageName}`);
      }

      const parentIssue = await parentIssuePayload.issue;

      await Promise.all(
        childIssueTemplates.map(async (template, idx) => {
          const description =
            typeof template.description === 'function'
              ? await template.description(pkg.packageName)
              : template.description;

          if (!description) {
            return;
          }

          return createOrUpdateIssue({
            teamName: Configuration.teamName,
            projectName: Configuration.projectName,
            title: template.title(pkg.packageName),
            description,
            labelNames: template.labelNames,
            parentIssueId: parentIssue.id,
            sortOrderInParentIssue: idx,
          });
        })
      );
    }
  )();

export async function createOrUpdateIssues(packages: Package[]) {
  await updateUmbrellaIssue();
  const downloadStats = await getNpmDownloadStats(packages);
  const sortedPackages = packages.sort(
    (a, b) =>
      downloadStats[b.packageName].byTimePeriods['last-month'] -
      downloadStats[a.packageName].byTimePeriods['last-month']
  );
  for (const [idx, pkg] of sortedPackages.entries()) {
    await createOrUpdateIssuesForPackage(
      pkg,
      downloadStats[pkg.packageName],
      idx,
      sortedPackages.length
    );
  }
}
