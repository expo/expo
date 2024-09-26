import parseDiff from 'parse-diff';
import path from 'path';

import { Changelog } from '../../Changelogs';
import { EXPO_DIR } from '../../Constants';
import { PullRequest } from '../../GitHub';
import * as Markdown from '../../Markdown';
import { markdownLink } from '../reports';
import { ReviewComment, ReviewInput, ReviewOutput, ReviewStatus } from '../types';

export default async function ({ pullRequest, diff }: ReviewInput): Promise<ReviewOutput> {
  const changelogs = diff.filter(
    (fileDiff) =>
      // find all CHANGELOG.md files, except the global one
      path.basename(fileDiff.to!) === 'CHANGELOG.md' && path.dirname(fileDiff.path) !== EXPO_DIR
  );
  const comments: ReviewComment[] = [];

  for (const changelogDiff of changelogs) {
    // We need a `position` for each review comment. The position value equals the number of
    // lines down from the first "@@" chunk header in the file you want to add a comment.
    // The line just below the "@@" line is position 1, the next line is position 2, and so on.
    // The position in the diff continues to increase through lines of whitespace and additional
    // chunks until the beginning of a new file.
    // (ref: https://docs.github.com/en/rest/reference/pulls#create-a-review-for-a-pull-request)
    let position = 0;

    for (const chunk of changelogDiff.chunks) {
      chunk.changes.forEach((change) => {
        position++;

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
          position,
          body: generateSuggestion(pullRequest, change),
        });
      });

      // GitHub documentation is not clear about this, but position needs to be incremented after each chunk.
      position++;
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
