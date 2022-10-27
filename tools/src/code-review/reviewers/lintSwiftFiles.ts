import minimatch from 'minimatch';
import path from 'path';

import Git from '../../Git';
import { lintStringAsync, LintViolation } from '../../linting/SwiftLint';
import { ReviewComment, ReviewInput, ReviewOutput, ReviewStatus } from '../types';

const IGNORED_PATHS = ['ios/{vendored,versioned}/**', '**/{Tests,UITests}/**'];

/**
 * The entry point for the reviewer checking whether the PR violates SwiftLint rules.
 */
export default async function ({ pullRequest, diff }: ReviewInput): Promise<ReviewOutput | null> {
  const swiftFiles = diff.filter((fileDiff) => {
    return (
      !fileDiff.deleted &&
      path.extname(fileDiff.path) === '.swift' &&
      !IGNORED_PATHS.some((pattern) => minimatch(fileDiff.to!, pattern))
    );
  });

  const comments: ReviewComment[] = [];
  let errorsCount = 0;

  // Iterate over diffs of Swift files
  for (const fileDiff of swiftFiles) {
    // Read file's content at the PR head commit
    const newFileContent = await Git.readFileAsync(pullRequest.head.sha, fileDiff.to!);

    // Lint the new content
    const violations = await lintStringAsync(newFileContent);

    for (const chunk of fileDiff.chunks) {
      for (const change of chunk.changes) {
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
            line: violationAtLine.line,
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
      return '🔴';
    case 'warning':
      return '🟠';
    default:
      return '';
  }
}

/**
 * Generates the review comment body for given violation.
 */
function commentBodyForViolation(violation: LintViolation): string {
  const emoji = severityToEmoji(violation.severity);
  return `#### ${emoji} SwiftLint: [${violation.type} Violation](https://realm.github.io/SwiftLint/${violation.ruleId}.html)
${violation.reason}`;
}
