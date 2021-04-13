import { GitFileDiff } from '../Git';
import { PullRequest } from '../GitHub';

export enum ReviewStatus {
  PASSIVE = 1,
  WARN = 2,
  ERROR = 3,
}

export type ReviewComment = {
  path: string;
  position: number;
  body: string;
};

export type ReviewOutput = {
  status: ReviewStatus;
  title?: string;
  body?: string;
  comments?: ReviewComment[];
};

export type ReviewInput = {
  pullRequest: PullRequest;
  mergeBaseSha: string;
  diff: GitFileDiff[];
};

/**
 * Review event is sent during review submission and
 */
export enum ReviewEvent {
  COMMENT = 'COMMENT',
  APPROVE = 'APPROVE',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
}

export enum ReviewState {
  PENDING = 'PENDING',
  COMMENTED = 'COMMENTED',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
}
