import parseDiff from 'parse-diff';
import path from 'path';

import { Changelog } from '../../Changelogs';
import { PullRequest } from '../../GitHub';
import * as Markdown from '../../Markdown';
import { ReviewComment, ReviewInput, ReviewOutput, ReviewStatus } from '../types';

export default async function ({ pullRequest, diff }: ReviewInput): Promise<ReviewOutput> {
  const changelogs = diff.filter((fileDiff) => path.basename(fileDiff.to!) === 'CHANGELOG.md');
  const comments: ReviewComment[] = [];

  for (const changelogDiff of changelogs) {
    for (const chunk of changelogDiff.chunks) {
      chunk.changes.forEach((change, index) => {
        // No need to care about unchanged or deleted lines
        if (change.type !== 'add') {
          return;
        }

        // Parse change content to markdown tokens
        const [listToken] = Markdown.lexify(change.content.substr(1));

        // Make sure that the line is a list item
        if (!Markdown.isListToken(listToken) || !Markdown.isListItemToken(listToken.items[0])) {
          return;
        }

        const { pullRequests } = Changelog.textToChangelogEntry(listToken.items[0].text);

        // Skip if entry already has links to at least one PR
        if (pullRequests.length > 0) {
          return;
        }

        comments.push({
          path: changelogDiff.to!,
          position: index + 1,
          body: generateSuggestion(pullRequest, change),
        });
      });
    }
  }
  if (comments.length > 0) {
    return {
      status: ReviewStatus.WARN,
      title: 'Missing links in changelog entries',
      body: "I've added some suggestions below, you can just apply and commit them 😉",
      comments,
    };
  } else {
    return {
      status: ReviewStatus.PASSIVE,
    };
  }
}

/**
 * Returns a link in markdown format.
 */
function markdownLink(name: string, url: string): string {
  return `[${name}](${url})`;
}

/**
 * Generates GitHub's suggestion for given PR and change object.
 */
function generateSuggestion(pullRequest: PullRequest, change: parseDiff.Change) {
  const prLink = markdownLink('#' + pullRequest.number, pullRequest.html_url);
  const userLink = markdownLink('@' + pullRequest.user!.login, pullRequest.user!.html_url);

  return `\`\`\`suggestion
${change.content.substr(1).trim()} (${prLink} by ${userLink})
\`\`\`
`;
}
