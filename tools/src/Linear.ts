import { Issue, IssueLabel, LinearClient, User, WorkflowState } from '@linear/sdk';
import {
  IssueCreateInput,
  IssueFilter,
  IssueLabelFilter,
  UserFilter,
} from '@linear/sdk/dist/_generated_documents';

const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY ?? '<LINEAR-API-KEY>',
});

export const ENG_TEAM_ID = 'e678ab8b-874f-4ee2-bf4b-6c0b60ac2743';

/**
 * Creates a new issue.
 * Defaults teamId to the Engineering team.
 */
export async function createIssueAsync(
  issueInput: Omit<IssueCreateInput, 'teamId'> & Partial<IssueCreateInput>
) {
  await linearClient.createIssue({
    teamId: ENG_TEAM_ID,
    ...issueInput,
  });
}

/**
 * Gets a label by name or creates it if it doesn't exist.
 *
 */
export async function getOrCreateLabelAsync(
  labelName: string,
  teamId?: string
): Promise<IssueLabel> {
  const filter: IssueLabelFilter = { name: { eq: labelName } };
  if (teamId) {
    filter.team = { id: { eq: teamId } };
  }

  const labels = await linearClient.issueLabels({ filter });
  if (labels.nodes[0]) {
    return labels.nodes[0];
  }

  const payload = await linearClient.createIssueLabel({ name: labelName });
  const label = await payload.issueLabel;

  if (!label) {
    throw new Error(`Failed to create Linear label: ${labelName}`);
  }

  return label;
}

/**
 * Gets a workflow state by name and team ID.
 */
export async function getTeamWorkflowStateAsync(
  workflowState: string,
  teamId: string
): Promise<WorkflowState> {
  const team = await linearClient.team(teamId);
  const states = await team.states({ filter: { name: { eq: workflowState } } });
  const state = states.nodes?.[0];

  if (!state) {
    throw new Error(`Failed to find Linear state: ${state}`);
  }

  return state;
}

/**
 * Gets a workflow state by name and team ID.
 */
export async function getTeamMembersAsync({
  filter,
  teamId,
}: {
  filter?: UserFilter;
  teamId: string;
}): Promise<User[]> {
  const team = await linearClient.team(teamId);
  const states = await team.members({ filter });

  return states.nodes;
}

/**
 * Gets issues by filter and team ID.
 */
export async function getIssuesAsync({
  filter,
  teamId,
}: {
  filter?: IssueFilter;
  teamId: string;
}): Promise<Issue[]> {
  const team = await linearClient.team(teamId);
  const issues = await team.issues({ filter });

  return issues.nodes;
}

/**
 * Updates the status of an issue to Done.
 */
export async function closeIssueAsync({
  issueId,
  teamId,
}: {
  issueId: string;
  teamId: string;
}): Promise<boolean> {
  const doneWorkflowState = await getTeamWorkflowStateAsync('Done', teamId);
  const payload = await linearClient.updateIssue(issueId, { stateId: doneWorkflowState.id });

  return payload.success;
}

/**
 * Creates a comment on an issue.
 */
export async function commentIssueAsync({
  issueId,
  comment,
}: {
  issueId: string;
  comment: string;
}): Promise<boolean> {
  const payload = await linearClient.createComment({ issueId, body: comment });

  return payload.success;
}
