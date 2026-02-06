import chalk from 'chalk';

import { link } from '../Formatter';
import Git from '../Git';
import * as GitHub from '../GitHub';

const { green, blue, bold } = chalk;

/**
 * Returns SDK branch name (sdk-<version>) based on the label name (SDK <version>).
 */
export const branchNameFromLabel = (label: string) => {
  return label.replace(' ', '-').toLowerCase();
};

// TODO: Very naive implementation, needs to be improved based on CherryPickCommand.ts
export const isCherrypicked = async (hash: string, targetBranch: string) => {
  const mergeBase = await Git.mergeBaseAsync('main', targetBranch);
  const commitsOnDestinationBranch = await Git.logAsync({
    fromCommit: mergeBase,
    toCommit: targetBranch,
  });

  const commits = (
    await Git.logAsync({
      fromCommit: 'main',
      toCommit: targetBranch,
      cherryPick: 'left',
      symmetricDifference: true,
    })
  ).filter((srcCommit) => {
    const hasAlreadyBeenCherryPicked = commitsOnDestinationBranch.some(
      (destCommit) =>
        srcCommit.authorDate === destCommit.authorDate &&
        srcCommit.authorName === destCommit.authorName &&
        srcCommit.title === destCommit.title
    );
    return !hasAlreadyBeenCherryPicked;
  });

  return !commits.find((commit) => commit.hash.startsWith(hash));
};

function linkToPullRequest(pr: GitHub.PullRequestWithMerge): string {
  return link(blue('#' + pr.number), pr.url);
}

function linkToMerger(pr: GitHub.PullRequestWithMerge): string {
  const { mergedBy } = pr;
  return mergedBy ? link(green('@' + mergedBy.login), mergedBy.url) : 'anonymous';
}

export function formatPullRequest(pr: GitHub.PullRequestWithMerge): string {
  return `${linkToPullRequest(pr)}: ${bold(pr.title)} (merged by ${linkToMerger(pr)})`;
}
