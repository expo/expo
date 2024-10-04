import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR } from './Constants';
import { getPullRequestAsync } from './GitHub';
import { execAll, filterAsync } from './Utils';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Predefine some params used across almost all requests.
const owner = 'expo';
const repo = 'expo';

export type Workflow =
  RestEndpointMethodTypes['actions']['listRepoWorkflows']['response']['data']['workflows'][0] & {
    slug: string;
    baseSlug: string;
    inputs?: Record<string, string>;
  };

export type WorkflowDispatchEventInputs = Record<string, string>;

/**
 * Requests for the list of active workflows.
 */
export async function getWorkflowsAsync(): Promise<Workflow[]> {
  const response = await octokit.actions.listRepoWorkflows({
    owner,
    repo,
    // By default this API returns only 25 results per page.
    // We're already much beyond this number, but there is no chance we'll ever reach
    // the max number of results per page, so we just hardcode it.
    per_page: 100,
  });

  // We need to filter out some workflows because they might have
  // - empty `name` or `path` (why?)
  // - inactive state
  // - workflow config no longer exists
  const workflows = await filterAsync(response.data.workflows, async (workflow) =>
    Boolean(
      workflow.name &&
        workflow.path &&
        workflow.state === 'active' &&
        (await fs.pathExists(path.join(EXPO_DIR, workflow.path)))
    )
  );
  return workflows
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((workflow) => {
      const slug = path.basename(workflow.path, path.extname(workflow.path));
      return {
        ...workflow,
        slug,
        baseSlug: slug,
      };
    });
}

/**
 * Requests for the list of manually triggered runs for given workflow ID.
 */
export async function getWorkflowRunsAsync(workflow_id: number, event?: string) {
  const { data } = await octokit.actions.listWorkflowRuns({
    owner,
    repo,
    workflow_id,
    event,
  });
  return data.workflow_runs;
}

/**
 * Resolves to the recently dispatched workflow run.
 */
export async function getLatestDispatchedWorkflowRunAsync(workflowId: number) {
  const workflowRuns = await getWorkflowRunsAsync(workflowId, 'workflow_dispatch');
  return workflowRuns[0] ?? null;
}

/**
 * Requests for the list of job for workflow run with given ID.
 */
export async function getJobsForWorkflowRunAsync(run_id: number) {
  const { data } = await octokit.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id,
  });
  return data.jobs;
}

/**
 * Dispatches an event that triggers a workflow with given ID or workflow filename (including extension).
 */
export async function dispatchWorkflowEventAsync(
  workflow_id: number | string,
  ref: string,
  inputs?: WorkflowDispatchEventInputs
): Promise<void> {
  await octokit.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id,
    ref,
    inputs: inputs ?? {},
  });
}

/**
 * Returns an array of issue IDs that has been auto-closed by the pull request.
 */
export async function getClosedIssuesAsync(pullRequestId: number): Promise<number[]> {
  const pullRequest = await getPullRequestAsync(pullRequestId, true);
  const matches = execAll(
    /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved) (#|https:\/\/github\.com\/expo\/expo\/issues\/)(\d+)/gi,
    pullRequest.body ?? '',
    2
  );
  return matches.map((match) => parseInt(match, 10)).filter((issue) => !isNaN(issue));
}

/**
 * Creates an issue comment with given body.
 */
export async function commentOnIssueAsync(issue_number: number, body: string) {
  const { data } = await octokit.issues.createComment({
    owner,
    repo,
    issue_number,
    body,
  });
  return data;
}
