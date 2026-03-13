import { LabelsSearch, PullRequestWithMerge } from '../GitHub';

/**
 * Command's options.
 */
export type CommandOptions = {
  continue: boolean;
  fix: boolean;
  dry: boolean;
  fixLabels: boolean;
  mergedBy?: string;
  tag?: string;
};

type PullRequest = PullRequestWithMerge & {
  label: LabelsSearch[number];
  sdkBranch?: string;
};

export type CommandState = {
  pullRequests: {
    toUpdateLabel: PullRequest[];
    toCherrypick: PullRequest[];
    toVerify: PullRequest[];
  };
  labels: LabelsSearch;
};

/**
 * Array type representing arguments passed to the tasks.
 */
export type TaskArgs = [CommandState, CommandOptions];
