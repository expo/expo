import { randomUUID } from 'crypto';

import { createCommentAsync, getAuthenticatedUserAsync, listAllCommentsAsync } from '../GitHub';
import { dispatchWorkflowEventAsync } from '../GitHubActions';
import { fetchPublicPullRequestRefAsync } from './github';
import type { PullRequestRef } from './types';
import { normalizeHeadSha, normalizePullRequestRef, normalizeSandboxCwd } from './validation';

export const DEFAULT_GITHUB_SANDBOX_WORKFLOW_FILE = 'pr-sandbox-session.yml';
export const DEFAULT_GITHUB_SANDBOX_WORKFLOW_REF = 'main';
export const DEFAULT_GITHUB_SANDBOX_IMAGE = 'node:22-bookworm';

const COMMENT_MARKER_PATTERN =
  /<!-- pr-sandbox-session (session|command|result|destroy) ([A-Za-z0-9_.:-]+)(?: ([A-Za-z0-9_.:-]+))? -->\s*```json\s*([\s\S]*?)\s*```/;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_.:-]{1,120}$/;
const DOCKER_IMAGE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:/@-]{0,255}$/;
const MAX_COMMAND_LENGTH = 8_192;
const DEFAULT_COMMAND_TIMEOUT_MS = 300_000;
const MAX_COMMAND_TIMEOUT_MS = 3_600_000;
const DEFAULT_IDLE_TIMEOUT_SECONDS = 1_800;
const DEFAULT_RESULT_TIMEOUT_GRACE_MS = 600_000;
const DEFAULT_POLL_INTERVAL_MS = 5_000;

export type GitHubSandboxNetwork = 'none' | 'bridge';

export type GitHubSandboxSession = {
  provider: 'github_actions';
  sessionId: string;
  repo: string;
  pullNumber: number;
  headSha: string;
  controlIssue: number;
  workflowFile: string;
  workflowRef: string;
  idleTimeoutSeconds: number;
  controllerLogin: string;
  createdAt: string;
};

export type GitHubSandboxCommandRequest = {
  command: string;
  cwd: string;
  timeout: number;
  network: GitHubSandboxNetwork;
  image: string;
};

export type GitHubSandboxCommand = GitHubSandboxCommandRequest & {
  sessionId: string;
  commandId: string;
  createdAt: string;
};

export type GitHubSandboxCommandResult = GitHubSandboxCommandRequest & {
  sessionId: string;
  commandId: string;
  success: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
  startedAt?: string;
  finishedAt: string;
};

export type GitHubSandboxDestroyRequest = {
  sessionId: string;
  requestedAt: string;
};

export type GitHubSandboxCommentKind = 'session' | 'command' | 'result' | 'destroy';

export type GitHubSandboxCommentEntry = {
  kind: GitHubSandboxCommentKind;
  sessionId: string;
  commandId?: string;
  payload: unknown;
  commentId?: number;
  createdAt?: string;
  authorLogin?: string;
};

type GitHubIssueComment = Awaited<ReturnType<typeof listAllCommentsAsync>>[number];

function delayAsync(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePositiveInteger(
  value: string | number | undefined,
  name: string,
  defaultValue?: number
): number {
  if (value == null || value === '') {
    if (defaultValue != null) {
      return defaultValue;
    }
    throw new Error(`Provide ${name}.`);
  }
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return normalized;
}

export function normalizeGitHubSandboxSessionId(sessionId: string): string {
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    throw new Error(
      'GitHub sandbox session IDs must be 1-120 chars and contain only letters, numbers, dot, underscore, colon, or hyphen.'
    );
  }
  return sessionId;
}

export function createGitHubSandboxSessionId(ref: PullRequestRef): string {
  const normalizedRepo = `${ref.owner}-${ref.name}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const suffix = randomUUID().slice(0, 8);
  return normalizeGitHubSandboxSessionId(
    `gha-pr-${normalizedRepo}-${ref.pullNumber}-${ref.headSha.slice(0, 12)}-${suffix}`
  );
}

export function normalizeGitHubSandboxNetwork(network: string | undefined): GitHubSandboxNetwork {
  if (network == null || network === '' || network === 'none') {
    return 'none';
  }
  if (network === 'bridge' || network === 'default') {
    return 'bridge';
  }
  throw new Error('--network must be "none", "bridge", or "default".');
}

function normalizeDockerImage(image: string | undefined): string {
  if (image == null || image === '') {
    return DEFAULT_GITHUB_SANDBOX_IMAGE;
  }
  if (!DOCKER_IMAGE_PATTERN.test(image)) {
    throw new Error('--image must be a Docker image reference without whitespace.');
  }
  return image;
}

export function normalizeGitHubSandboxCommandRequest(input: {
  command?: string;
  cwd?: string;
  timeout?: string | number;
  network?: string;
  image?: string;
}): GitHubSandboxCommandRequest {
  const command = input.command?.trim();
  if (!command) {
    throw new Error('Provide --command for run_command.');
  }
  if (command.length > MAX_COMMAND_LENGTH || command.includes('\0')) {
    throw new Error(`GitHub sandbox commands must be 1-${MAX_COMMAND_LENGTH} characters.`);
  }

  const timeout =
    input.timeout == null || input.timeout === ''
      ? DEFAULT_COMMAND_TIMEOUT_MS
      : Number(input.timeout);
  if (!Number.isInteger(timeout) || timeout <= 0 || timeout > MAX_COMMAND_TIMEOUT_MS) {
    throw new Error(
      `GitHub sandbox command timeout must be a positive integer up to ${MAX_COMMAND_TIMEOUT_MS}.`
    );
  }

  return {
    command,
    cwd: normalizeSandboxCwd(input.cwd) ?? '.',
    timeout,
    network: normalizeGitHubSandboxNetwork(input.network),
    image: normalizeDockerImage(input.image),
  };
}

export function buildGitHubSandboxComment(
  kind: GitHubSandboxCommentKind,
  sessionIdInput: string,
  payload: unknown,
  commandId?: string
): string {
  const sessionId = normalizeGitHubSandboxSessionId(sessionIdInput);
  const marker = `<!-- pr-sandbox-session ${kind} ${sessionId}${
    commandId ? ` ${commandId}` : ''
  } -->`;
  return `${marker}\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
}

export function parseGitHubSandboxComment(
  comment: Pick<GitHubIssueComment, 'body' | 'id' | 'created_at' | 'user'>
): GitHubSandboxCommentEntry | null {
  if (!comment.body) {
    return null;
  }

  const match = comment.body.match(COMMENT_MARKER_PATTERN);
  if (!match) {
    return null;
  }

  const [, kind, sessionId, commandId, rawPayload] = match;
  try {
    return {
      kind: kind as GitHubSandboxCommentKind,
      sessionId,
      commandId,
      payload: JSON.parse(rawPayload),
      commentId: comment.id,
      createdAt: comment.created_at,
      authorLogin: comment.user?.login ?? undefined,
    };
  } catch {
    return null;
  }
}

export function parseGitHubSandboxComments(
  comments: Pick<GitHubIssueComment, 'body' | 'id' | 'created_at' | 'user'>[],
  sessionIdInput: string
): GitHubSandboxCommentEntry[] {
  const sessionId = normalizeGitHubSandboxSessionId(sessionIdInput);
  return comments
    .map((comment) => parseGitHubSandboxComment(comment))
    .filter((entry): entry is GitHubSandboxCommentEntry => entry?.sessionId === sessionId)
    .sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return aTime - bTime || (a.commentId ?? 0) - (b.commentId ?? 0);
    });
}

export async function resolveGitHubSandboxPullRequestRefAsync(options: {
  prUrl?: string;
  repo?: string;
  pullNumber?: string | number;
  headSha?: string;
}): Promise<PullRequestRef> {
  if (options.prUrl && !options.headSha) {
    return await fetchPublicPullRequestRefAsync(options.prUrl);
  }
  if (!options.headSha) {
    throw new Error('Provide --head-sha, or provide --pr-url so it can be fetched.');
  }
  return normalizePullRequestRef({
    prUrl: options.prUrl,
    repo: options.repo,
    pullNumber: options.pullNumber,
    headSha: normalizeHeadSha(options.headSha),
  });
}

export async function createGitHubSandboxSessionAsync(options: {
  prUrl?: string;
  repo?: string;
  pullNumber?: string | number;
  headSha?: string;
  controlIssue?: string | number;
  workflowFile?: string;
  workflowRef?: string;
  idleTimeoutSeconds?: string | number;
}): Promise<GitHubSandboxSession> {
  const ref = await resolveGitHubSandboxPullRequestRefAsync(options);
  const controlIssue = normalizePositiveInteger(options.controlIssue, '--control-issue');
  const workflowFile = options.workflowFile ?? DEFAULT_GITHUB_SANDBOX_WORKFLOW_FILE;
  const workflowRef = options.workflowRef ?? DEFAULT_GITHUB_SANDBOX_WORKFLOW_REF;
  const idleTimeoutSeconds = normalizePositiveInteger(
    options.idleTimeoutSeconds,
    '--idle-timeout',
    DEFAULT_IDLE_TIMEOUT_SECONDS
  );
  const controllerLogin = (await getAuthenticatedUserAsync()).login;
  const sessionId = createGitHubSandboxSessionId(ref);
  const session: GitHubSandboxSession = {
    provider: 'github_actions',
    sessionId,
    repo: ref.repo,
    pullNumber: ref.pullNumber,
    headSha: ref.headSha,
    controlIssue,
    workflowFile,
    workflowRef,
    idleTimeoutSeconds,
    controllerLogin,
    createdAt: new Date().toISOString(),
  };

  await dispatchWorkflowEventAsync(workflowFile, workflowRef, {
    session_id: sessionId,
    repo: ref.repo,
    pull_number: String(ref.pullNumber),
    head_sha: ref.headSha,
    control_issue: String(controlIssue),
    idle_timeout_seconds: String(idleTimeoutSeconds),
    controller_login: controllerLogin,
  });
  await createCommentAsync(controlIssue, buildGitHubSandboxComment('session', sessionId, session));

  return session;
}

export async function postGitHubSandboxCommandAsync(options: {
  controlIssue: string | number;
  sessionId: string;
  command?: string;
  cwd?: string;
  timeout?: string | number;
  network?: string;
  image?: string;
}): Promise<GitHubSandboxCommand> {
  const controlIssue = normalizePositiveInteger(options.controlIssue, '--control-issue');
  const sessionId = normalizeGitHubSandboxSessionId(options.sessionId);
  const request = normalizeGitHubSandboxCommandRequest(options);
  const commandId = randomUUID();
  const command: GitHubSandboxCommand = {
    ...request,
    sessionId,
    commandId,
    createdAt: new Date().toISOString(),
  };
  await createCommentAsync(
    controlIssue,
    buildGitHubSandboxComment('command', sessionId, command, commandId)
  );
  return command;
}

export async function waitForGitHubSandboxCommandResultAsync(options: {
  controlIssue: string | number;
  sessionId: string;
  commandId: string;
  resultTimeoutMs?: string | number;
  pollIntervalMs?: string | number;
}): Promise<GitHubSandboxCommandResult> {
  const controlIssue = normalizePositiveInteger(options.controlIssue, '--control-issue');
  const sessionId = normalizeGitHubSandboxSessionId(options.sessionId);
  const resultTimeoutMs = normalizePositiveInteger(
    options.resultTimeoutMs,
    '--result-timeout',
    DEFAULT_COMMAND_TIMEOUT_MS + DEFAULT_RESULT_TIMEOUT_GRACE_MS
  );
  const pollIntervalMs = normalizePositiveInteger(
    options.pollIntervalMs,
    '--poll-interval',
    DEFAULT_POLL_INTERVAL_MS
  );
  const deadline = Date.now() + resultTimeoutMs;

  while (Date.now() <= deadline) {
    const entries = parseGitHubSandboxComments(await listAllCommentsAsync(controlIssue), sessionId);
    const result = entries.find(
      (entry) => entry.kind === 'result' && entry.commandId === options.commandId
    );
    if (result) {
      return result.payload as GitHubSandboxCommandResult;
    }
    await delayAsync(pollIntervalMs);
  }

  throw new Error(
    `Timed out waiting for GitHub sandbox result ${options.commandId} in session ${sessionId}.`
  );
}

export async function listGitHubSandboxLogEntriesAsync(options: {
  controlIssue: string | number;
  sessionId: string;
}): Promise<GitHubSandboxCommentEntry[]> {
  const controlIssue = normalizePositiveInteger(options.controlIssue, '--control-issue');
  return parseGitHubSandboxComments(
    await listAllCommentsAsync(controlIssue),
    normalizeGitHubSandboxSessionId(options.sessionId)
  );
}

export async function destroyGitHubSandboxSessionAsync(options: {
  controlIssue: string | number;
  sessionId: string;
}): Promise<GitHubSandboxDestroyRequest> {
  const controlIssue = normalizePositiveInteger(options.controlIssue, '--control-issue');
  const sessionId = normalizeGitHubSandboxSessionId(options.sessionId);
  const request: GitHubSandboxDestroyRequest = {
    sessionId,
    requestedAt: new Date().toISOString(),
  };
  await createCommentAsync(controlIssue, buildGitHubSandboxComment('destroy', sessionId, request));
  return request;
}
