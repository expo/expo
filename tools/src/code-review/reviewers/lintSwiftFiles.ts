import path from 'path';

import Git from '../../Git';
import { lintStringAsync, LintViolation } from '../../linting/SwiftLint';
import { ReviewComment, ReviewInput, ReviewOutput, ReviewStatus } from '../types';

/**
 * The entry point for the reviewer checking whether the PR violates SwiftLint rules.
 */
export default async function ({ pullRequest, diff }: ReviewInput): Promise<ReviewOutput | null> {
  const swiftFiles = diff.filter((fileDiff) => {
    return !fileDiff.deleted && path.extname(fileDiff.path) === '.swift';
  });

  const comments: ReviewComment[] = [];
  let errorsCount = 0;

  // Iterate over diffs of Swift files
  for (const fileDiff of swiftFiles) {
    // Lint file's content at the PR head commit
    const violations = await lintStringAsync(
      await Git.readFileAsync(fileDiff.to!, pullRequest.head.sha)
    );

    // Count the position for review comments
    let position = 0;

    for (const chunk of fileDiff.chunks) {
      for (const change of chunk.changes) {
        position++;

        // Only added lines can violate the rules
        if (change.type !== 'add') {
          continue;
        }
        // Check if there is any issue at the current line
        const violationAtLine = violations.find(({ line }) => line === change.ln);

        if (violationAtLine) {
          if (violationAtLine.severity === 'error') {
            errorsCount++;
          }

          comments.push({
            path: fileDiff.to!,
            position,
            body: commentBodyForViolation(violationAtLine),
          });
        }
      }
    }
  }

  if (comments.length > 0) {
    return {
      status: errorsCount > 0 ? ReviewStatus.ERROR : ReviewStatus.WARN,
      title: 'SwiftLint Violations',
      comments,
      body: `Found ${comments.length} violation${
        comments.length > 1 ? 's' : ''
      }, ${errorsCount} serious. See the review comments below for more insights.`,
    };
  } else {
    return {
      status: ReviewStatus.PASSIVE,
    };
  }
}

/**
 * Returns an emoji that is appropriate for given severity.
 */
function severityToEmoji(severity: LintViolation['severity']): string {
  switch (severity) {
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️ ';
    default:
      return '';
  }
}

/**
 * Generates the review comment body for given violation.
 */
function commentBodyForViolation(violation: LintViolation): string {
  const emoji = severityToEmoji(violation.severity);
  return `### ${emoji} SwiftLint Violation: ${violation.type}\n\n_${violation.reason}_`;
}
