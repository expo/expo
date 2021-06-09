import chalk from 'chalk';

import Git from '../Git';
import * as GitHub from '../GitHub';
import logger from '../Logger';
import { generateReviewBodyFromOutputs } from './reports';
import checkMissingChangelogs from './reviewers/checkMissingChangelogs';
import reviewChangelogEntries from './reviewers/reviewChangelogEntries';
import reviewForbiddenFiles from './reviewers/reviewForbiddenFiles';
import {
  ReviewEvent,
  ReviewComment,
  ReviewInput,
  ReviewOutput,
  ReviewStatus,
  ReviewState,
} from './types';

/**
 * An array with functions whose purpose is to check and review the diff.
 */
const REVIEWERS = [checkMissingChangelogs, reviewChangelogEntries, reviewForbiddenFiles];

enum Label {
  PASSED_CHECKS = 'bot: passed checks',
  SUGGESTIONS = 'bot: suggestions',
  NEEDS_CHANGES = 'bot: needs changes',
}

/**
 * Goes through the changes included in given pull request and checks if they meet basic requirements.
 */
export async function reviewPullRequestAsync(prNumber: number) {
  const pr = await GitHub.getPullRequestAsync(prNumber);
  const user = await GitHub.getAuthenticatedUserAsync();

  // Fetch the base commit with a depth that is equal to the number of commits in the PR increased by one.
  // The last one is a merge base.
  logger.info(
    '👾 Fetching base commit',
    chalk.yellow.bold(pr.head.sha),
    'with depth',
    chalk.yellow((pr.commits + 1).toString())
  );
  await Git.fetchAsync({
    remote: 'origin',
    ref: pr.head.sha,
    depth: pr.commits + 1,
  });

  // Get the diff of the pull request.
  const diff = await Git.getDiffAsync(`${pr.head.sha}~${pr.commits}`, pr.head.sha);

  const input: ReviewInput = {
    pullRequest: pr,
    diff,
  };

  // Run all the checks asynchronously and collects their outputs.
  logger.info('🕵️‍♀️  Reviewing changes');
  const outputs = (await Promise.all(REVIEWERS.map((reviewer) => reviewer(input)))).filter(
    Boolean
  ) as ReviewOutput[];

  // Only active (non-passive) outputs will be reported in the review body.
  const activeOutputs = outputs.filter(
    (output) => output.title && output.body && output.status !== ReviewStatus.PASSIVE
  );

  // Get a list of my previous reviews. We'll invalidate them once the new one is submitted.
  const previousReviews = (await GitHub.listPullRequestReviewsAsync(pr.number)).filter(
    (review) => review.user?.login === user.login
  );

  // Generate review body and decide whether the review needs to request for changes or not.
  const event = getReviewEventFromOutputs(outputs);
  const comments = getReviewCommentsFromOutputs(outputs);
  const body = generateReviewBodyFromOutputs(activeOutputs, comments.length > 0, pr.head.sha);

  // If it's the first review and there is nothing to complain,
  // just return early — no need to bother PR's author.
  if (!activeOutputs.length && !comments.length && !previousReviews.length) {
    await updateLabelsAsync(pr, Label.PASSED_CHECKS);
    logger.success('🥳 Everything looks good to me! There is no need to submit a review.');
    return;
  }

  // Reset my reviews' current state if I previously requested for changes.
  if (
    previousReviews[previousReviews.length - 1]?.state === ReviewState.CHANGES_REQUESTED &&
    event !== ReviewEvent.REQUEST_CHANGES
  ) {
    logger.info('🙈 Resetting my review state by re-requesting');
    await GitHub.requestPullRequestReviewersAsync(pr.number, [user.login]);
  }

  // Create new pull request review.
  const review = await GitHub.createPullRequestReviewAsync(pr.number, {
    body,
    event,
    comments,
  });
  logger.info('📝 Submitted new review at:', chalk.blue(review.html_url));

  // As we never approve the PR by the bot (don't want to bypass the "at least one approval" requirement),
  // adding appropriate labels instead seems to be a good compromise and makes it clear which PRs are ready to be reviewed by us.
  const label = getLabelFromOutputs(activeOutputs);
  await updateLabelsAsync(pr, label);

  // Previous reviews are no longer useful — we would delete them, but
  // unfortunately they cannot be deleted entirely so we only make them smaller.
  await invalidatePreviousReviewsAsync(pr.number, previousReviews, review);

  logger.success("🥳 I'm done!");
}

/**
 * Marks previous reviews as outdated by changing its body and linking to the latest one.
 * Probably no need to keep the old body for history as GitHub shows previous revisions of edited comments.
 */
async function invalidatePreviousReviewsAsync(
  prNumber: number,
  previousReviews: GitHub.PullRequestReview[],
  newReview: GitHub.PullRequestReview
): Promise<void> {
  for (const review of previousReviews) {
    await GitHub.updatePullRequestReviewAsync(
      prNumber,
      review.id,
      `*The review previously left here is no longer valid, jump to the latest one 👉 ${newReview.html_url}*`
    );
  }
  if (previousReviews.length > 0) {
    logger.info('💥 Invalidated previous reviews');

    // In order not to exceed rate limits, it should be enough to remove comments only from the last review.
    await GitHub.deleteAllPullRequestReviewCommentsAsync(
      prNumber,
      previousReviews[previousReviews.length - 1].id
    );
  }
}

/**
 * If any of the check failed, we want the review to request for changes.
 * Otherwise, it's just a comment (and so fixes are not obligatory).
 * There is no case where we approve the PR — we still want a human to review these changes :)
 */
function getReviewEventFromOutputs(outputs: ReviewOutput[]): GitHub.PullRequestReviewEvent {
  return outputs.some((output) => output.status === ReviewStatus.ERROR)
    ? ReviewEvent.REQUEST_CHANGES
    : ReviewEvent.COMMENT;
}

/**
 * Concats comments from all review outputs.
 */
function getReviewCommentsFromOutputs(outputs: ReviewOutput[]): ReviewComment[] {
  return ([] as ReviewComment[]).concat(...outputs.map((output) => output.comments ?? []));
}

/**
 * Returns GitHub's label based on outputs' final status.
 */
function getLabelFromOutputs(outputs: ReviewOutput[]): Label {
  const finalStatus = outputs.reduce(
    (acc, output) => Math.max(acc, output.status),
    ReviewStatus.PASSIVE
  );
  switch (finalStatus) {
    case ReviewStatus.ERROR:
      return Label.NEEDS_CHANGES;
    case ReviewStatus.WARN:
      return Label.SUGGESTIONS;
    default:
      return Label.PASSED_CHECKS;
  }
}

/**
 * Updates bot's labels of the PR so that only given label is assigned.
 */
async function updateLabelsAsync(pr: GitHub.PullRequest, newLabel: Label) {
  const prLabels = pr.labels.map((label) => label.name);
  const botLabels = Object.values(Label);

  // Get an array of bot's labels that are already assigned to the PR.
  const labelsToRemove = botLabels.filter(
    (label) => label !== newLabel && prLabels.includes(label)
  );

  for (const labelToRemove of labelsToRemove) {
    logger.info(`🏷  Removing ${chalk.yellow(labelToRemove)} label`);
    await GitHub.removeIssueLabelAsync(pr.number, labelToRemove);
  }
  if (!prLabels.includes(newLabel)) {
    logger.info(`🏷  Adding ${chalk.yellow(newLabel)} label`);
    await GitHub.addIssueLabelsAsync(pr.number, [newLabel]);
  }
}
