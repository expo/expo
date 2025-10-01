import { LabelsSearch, PullRequestsSearch } from '../GitHub';

/**
 * Command's options.
 */
export type CommandOptions = {
  continue: boolean;
  fix: boolean;
};

type PullRequestsByLabel = LabelsSearch[number] & {
  pullRequests: PullRequestsSearch;
};

export type CommandState = {
  pullRequestsByLabel: PullRequestsByLabel[];
};

/**
 * Array type representing arguments passed to the tasks.
 */
export type TaskArgs = [CommandState, CommandOptions];
