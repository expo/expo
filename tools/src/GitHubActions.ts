import {
  ActionsListRepoWorkflowsResponseData,
  ActionsListWorkflowRunsForRepoResponseData,
  ActionsListJobsForWorkflowRunResponseData,
} from '@octokit/types';
import { request } from '@octokit/request';
import fs from 'fs-extra';
import path from 'path';

import { execAll, filterAsync } from './Utils';
import { EXPO_DIR } from './Constants';
import logger from './Logger';

export type Workflow = ActionsListRepoWorkflowsResponseData['workflows'][0] & {
  slug: string;
  baseSlug: string;
  inputs?: Record<string, string>;
};
export type WorkflowRun = ActionsListWorkflowRunsForRepoResponseData['workflow_runs'][0];
export type WorkflowDispatchEventInputs = Record<string, string>;
export type Job = ActionsListJobsForWorkflowRunResponseData['jobs'][0];

/**
 * Requests for the list of active workflows.
 */
export async function getWorkflowsAsync(): Promise<Workflow[]> {
  const response = await request('GET /repos/:owner/:repo/actions/workflows', makeExpoOptions({}));

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
export async function getWorkflowRunsAsync(
  workflowId: number,
  event?: string
): Promise<WorkflowRun[]> {
  const response = await request(
    'GET /repos/:owner/:repo/actions/runs',
    makeExpoOptions({ event })
  );
  return response.data.workflow_runs.filter(
    (workflowRun) => workflowRun.workflow_id === workflowId
  );
}

/**
 * Resolves to the recently dispatched workflow run.
 */
export async function getLatestDispatchedWorkflowRunAsync(
  workflowId: number
): Promise<WorkflowRun | null> {
  const workflowRuns = await getWorkflowRunsAsync(workflowId, 'workflow_dispatch');
  return workflowRuns[0] ?? null;
}

/**
 * Requests for the list of job for workflow run with given ID.
 */
export async function getJobsForWorkflowRunAsync(workflowRunId: number): Promise<Job[]> {
  const response = await request(
    'GET /repos/:owner/:repo/actions/runs/:run_id/jobs',
    makeExpoOptions({
      run_id: workflowRunId,
    })
  );
  return response.data.jobs;
}

/**
 * Dispatches an event that triggers a workflow with given ID.
 */
export async function dispatchWorkflowEventAsync(
  workflowId: number,
  ref: string,
  inputs?: WorkflowDispatchEventInputs
): Promise<void> {
  const response = await request(
    'POST /repos/:owner/:repo/actions/workflows/:workflow_id/dispatches',
    makeExpoOptions({
      workflow_id: workflowId,
      ref,
      inputs: inputs ?? {},
    })
  );
  if (response.status !== 204) {
    logger.error('💥 Dispatching workflow failed with response', JSON.stringify(response, null, 2));
    process.exit(1);
  }
  logger.success('🎉 Successfully dispatched workflow event ');
}

/**
 * Copies given object with params specific for `expo/expo` repository and with authorization token.
 */
function makeExpoOptions<T>(
  options: T & { headers?: object }
): T & { owner: string; repo: string } {
  return {
    headers: {
      authorization: `token ${process.env.GITHUB_TOKEN}`,
      ...options?.headers,
    },
    owner: 'expo',
    repo: 'expo',
    ...options,
  };
}
