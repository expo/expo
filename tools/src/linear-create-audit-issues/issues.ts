import chalk from 'chalk';

import { Package } from '../Packages';
import Configuration from './Configuration';
import linearClient from './LinearClient';
import { getUmbrellaIssue, getIssue, getTeam, getProject, getLabel } from './cache';
import { withSpinner } from './helpers';

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

const createOrUpdateIssuesForPackage = (pkg: Package) =>
  withSpinner(
    `Creating or updating issue for ${chalk.bold.cyanBright(pkg.packageName)}`,
    async () => {
      const umbrellaIssue = getUmbrellaIssue();

      const { title, description, childIssueTemplates } =
        Configuration.umbrellaIssue.childIssueTemplate;

      const parentIssuePayload = await createOrUpdateIssue({
        title: title(pkg.packageName),
        description,
        teamName: Configuration.teamName,
        projectName: Configuration.projectName,
        labelNames: Configuration.umbrellaIssue.labelNames,
        parentIssueId: umbrellaIssue.id,
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
  await Promise.all(packages.map(createOrUpdateIssuesForPackage));
}
