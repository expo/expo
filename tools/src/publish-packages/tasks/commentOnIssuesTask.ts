import {
  // dispatchWorkflowEventAsync,
  getClosedIssuesAsync,
  // getWorkflowsAsync,
} from '../../GitHubActions';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import logger from '../../Logger';
// import Git from '../../Git';
import { ChangelogEntry, UNPUBLISHED_VERSION_NAME } from '../../Changelogs';
import { CommentatorPayload } from '../../commands/CommentatorCommand';
import { selectPackagesToPublish } from './selectPackagesToPublish';

type CommentRowObject = {
  packageName: string;
  version: string;
  tag: string;
  pullRequests: number[];
};

/**
 * Dispatches GitHub Actions workflow that adds comments to the issues
 * that were closed by pull requests mentioned in the changelog changes.
 */
export const commentOnIssuesTask = new Task<TaskArgs>(
  {
    name: 'commentOnIssuesTask',
    dependsOn: [selectPackagesToPublish],
    backupable: true,
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    if (!process.env.GITHUB_TOKEN) {
      logger.error(
        'Environment variable `GITHUB_TOKEN` must be set to dispatch a commentator workflow.'
      );
      // should prompt for it?
      return;
    }

    // const workflows = await getWorkflowsAsync();
    // const workflow = workflows.find((workflow) => workflow.slug === 'commentator');

    // if (!workflow) {
    //   logger.error(`Commentator workflow not found 😠`);
    //   return;
    // }

    // const currentBranchName = await Git.getCurrentBranchNameAsync();

    // An object whose key is the issue number and value is an array of rows to put in the comment's body.
    const commentRows: Record<number, CommentRowObject[]> = {};

    // An object whose key is the pull request number and value is an array of issues it closes.
    const closedIssuesRegistry: Record<number, number[]> = {};

    for (const { pkg, state } of parcels) {
      const versionChanges = state.changelogChanges?.versions[UNPUBLISHED_VERSION_NAME];

      if (!versionChanges) {
        continue;
      }
      const allEntries = ([] as ChangelogEntry[]).concat(...Object.values(versionChanges));
      const allPullRequests = new Set(
        ([] as number[]).concat(...allEntries.map((entry) => entry.pullRequests ?? []))
      );

      // Visit all pull requests mentioned in the changelog.
      for (const pullRequest of allPullRequests) {
        // Look for closed issues just once per pull request to reduce number of GitHub API calls.
        if (!closedIssuesRegistry[pullRequest]) {
          closedIssuesRegistry[pullRequest] = await getClosedIssuesAsync(pullRequest);
        }
        const closedIssues = closedIssuesRegistry[pullRequest];

        console.log(pullRequest, ':', closedIssues);

        // Visit all issues that have been closed by this pull request.
        for (const issue of closedIssues) {
          if (!commentRows[issue]) {
            commentRows[issue] = [];
          }

          // Check if the row for the package already exists. If it does, then just add
          // another pull request reference into that row instead of creating a new one.
          // This is to prevent duplicating packages within the comment's body.
          const existingRowForPackage = commentRows[issue].find(
            (entry) => entry.packageName === pkg.packageName
          );

          if (existingRowForPackage) {
            existingRowForPackage.pullRequests.push(pullRequest);
          } else {
            commentRows[issue].push({
              packageName: pkg.packageName,
              version: state.releaseVersion!,
              tag: options.tag,
              pullRequests: [pullRequest],
            });
          }
        }
      }
    }

    const payload: CommentatorPayload = Object.entries(commentRows).map(([issue, entries]) => {
      return {
        issue: +issue,
        body: generateCommentBody(entries),
      };
    });

    console.log(payload);

    // await dispatchWorkflowEventAsync(workflow.id, currentBranchName, {
    //   payload: JSON.stringify(payload).replace(/"/g, '\\"'),
    // });
  }
);

function generateCommentBody(entries: CommentRowObject[]): string {
  const rows = entries.map(({ packageName, version, tag, pullRequests }) => {
    const prs = pullRequests.map((pr) => '#' + pr).join(', ');
    return `| ${packageName} | ${version} | ${tag} | ${prs} |`;
  });

  return `Some changes in the following packages that may fix this issue have just been published 🥳

| 📦 Package | 🔢 Version | 🏷 NPM tag | ↖️ Pull requests |
|:--:|:--:|:--:|:--:|
${rows.join('\n')}

If you're using bare workflow you can install them right away with \`yarn upgrade <package>@<npm tag>\`.
We kindly ask you for feedback whether they fixed this issue or not 🙏

For managed workflow they will become available with the next SDK release.`;
}
