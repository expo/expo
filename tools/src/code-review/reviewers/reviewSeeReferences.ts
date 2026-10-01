import path from 'node:path';

import { EXPO_DIR } from '../../Constants';
import * as GitHub from '../../GitHub';
import { isChangesetPath } from '../Changesets';
import { ReviewInput, ReviewOutput, ReviewStatus } from '../types';

export default async function ({ pullRequest, diff }: ReviewInput): Promise<ReviewOutput | null> {
  const errors: string[] = [];
  const issues = new Map<number, Awaited<ReturnType<typeof GitHub.getIssueAsync>>>();

  for (const file of diff) {
    const filePath = path.relative(EXPO_DIR, file.path);
    if (file.deleted || !isChangesetPath(filePath)) {
      continue;
    }
    for (const chunk of file.chunks) {
      for (const change of chunk.changes) {
        if (change.type !== 'add') {
          continue;
        }
        const reference = change.content.slice(1).match(/^\s*See:\s*(.*?)\s*$/i)?.[1];
        if (!reference) {
          continue;
        }
        const url = reference.match(/^\[[^\]]+\]\((https:\/\/[^)]+)\)$/)?.[1] ?? reference;
        const link = url.match(
          /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(issues|pull)\/(\d+)\/?(?:[?#].*)?$/i
        );
        const shorthand = reference.match(/^#(\d+)$/);
        const number = Number(link?.[3] ?? shorthand?.[1]);
        const repository = link?.[1].toLowerCase() ?? 'expo/expo';
        const isSelf = repository === 'expo/expo' && number === pullRequest.number;
        let isIssue = link?.[2].toLowerCase() === 'issues';

        if (shorthand && !isSelf) {
          let issue = issues.get(number);
          if (!issue) {
            issue = await GitHub.getIssueAsync(number);
            issues.set(number, issue);
          }
          isIssue = !issue.pull_request;
        }
        if (isSelf) {
          errors.push(
            `- \`${filePath}:${change.ln}\`: Remove the \`See:\` reference to this pull request; its link is generated automatically.`
          );
        } else if (isIssue) {
          errors.push(
            `- \`${filePath}:${change.ln}\`: \`See:\` must not reference an issue. Reference the pull request that made the change instead.`
          );
        }
      }
    }
  }

  return errors.length
    ? {
        status: ReviewStatus.ERROR,
        title: 'Invalid Changesets See: references',
        body: errors.join('\n'),
      }
    : null;
}
