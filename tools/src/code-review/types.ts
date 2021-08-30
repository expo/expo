import { GitFileDiff } from '../Git';
import { PullRequest } from '../GitHub';

/**
 * See "Properties of the comments items" section on
 * https://docs.github.com/en/rest/reference/pulls#create-a-review-for-a-pull-request
 */
export type ReviewComment = {
  path: string;
  position: number;
  body: string;
};

/**
 * The result of code reviews that is being used to generate the final review comment/report.
 */
export type ReviewOutput = {
  status: ReviewStatus;
  title?: string;
  body?: string;
  comments?: ReviewComment[];
};

/**
 * An input is an object that is passed to each code reviewer.
 * It contains some data that are commonly used by all reviewers.
 */
export type ReviewInput = {
  pullRequest: PullRequest;
  diff: GitFileDiff[];
};

/**
 * A status of the review output.
 */
export enum ReviewStatus {
  /**
   * Passive outputs are not included in the final report,
   * but they may have some comments/suggestions which are not obligatory to apply.
   */
  PASSIVE = 1,

  /**
   * Warnings are included in the final report and are not obligatory to fix.
   */
  WARN = 2,

  /**
   * Errors are included in the final report and are obligatory to fix.
   * It implies that the review will request for changes (will send `ReviewEvent.REQUEST_CHANGES` event).
   */
  ERROR = 3,
}

/**
 * Review event that is sent during review creation/submission.
 * The final review state depends on this event.
 */
export enum ReviewEvent {
  COMMENT = 'COMMENT',
  APPROVE = 'APPROVE',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
}
