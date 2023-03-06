import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import parseDiff from 'parse-diff';
import path from 'path';

import { EXPO_DIR } from './Constants';
import { GitFileDiff } from './Git';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const cachedPullRequests = new Map<number, PullRequest>();

// Predefine some params used across almost all requests.
const owner = 'expo';
const repo = 'expo';

/**
 * Returns public informations about the currently authenticated (by GitHub API token) user.
 */
export async function getAuthenticatedUserAsync() {
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

/**
 * Requests for the pull request object.
 */
export async function getPullRequestAsync(
  pull_number: number,
  cached: boolean = false
): Promise<PullRequest> {
  if (cached) {
    const cachedPullRequest = cachedPullRequests.get(pull_number);
    if (cachedPullRequest) {
      return cachedPullRequest;
    }
  }
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
  });
  cachedPullRequests.set(pull_number, data);
  return data;
}

/**
 * Requests and parses the diff of the pull request with given number.
 */
export async function getPullRequestDiffAsync(
  pull_number: number,
  base_path: string = EXPO_DIR
): Promise<GitFileDiff[]> {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
    headers: {
      accept: 'application/vnd.github.v3.diff',
    },
  });

  // When the custom accept header is provided the returned data
  // doesn't match declared type (it's a string).
  const diff = parseDiff(data as unknown as string);

  return diff.map((entry) => {
    return {
      ...entry,
      path: path.join(base_path, (entry.deleted ? entry.from : entry.to)!),
    };
  });
}

/**
 * Gets a list of reviews left in the pull request with given ID.
 */
export async function listPullRequestReviewsAsync(
  pull_number: number
): Promise<PullRequestReview[]> {
  const { data } = await octokit.pulls.listReviews({
    owner,
    repo,
    pull_number,
  });
  return data;
}

/**
 * Creates pull request review. By default the review is pending which needs to be submitted in order to be visible for other users.
 * Provide `event` option to create and submit at once.
 */
export async function createPullRequestReviewAsync<T>(
  pull_number: number,
  options?: T
): Promise<PullRequestReview> {
  const { data } = await octokit.pulls.createReview({
    owner,
    repo,
    pull_number,
    ...options,
  });
  return data;
}

/**
 * Updates pull request review with a new main comment.
 */
export async function updatePullRequestReviewAsync(
  pull_number: number,
  review_id: number,
  body: string
) {
  const { data } = await octokit.pulls.updateReview({
    owner,
    repo,
    pull_number,
    review_id,
    body,
  });
  return data;
}

/**
 * Gets a list of comments in review.
 */
export async function listPullRequestReviewCommentsAsync(pull_number: number, review_id: number) {
  const { data } = await octokit.pulls.listReviewComments({
    owner,
    repo,
    pull_number,
    review_id,
  });
  return data;
}

/**
 * Deletes a comment left under pull request review.
 */
export async function deletePullRequestReviewCommentAsync(comment_id: number) {
  const { data } = await octokit.pulls.deleteReviewComment({
    owner,
    repo,
    comment_id,
  });
  return data;
}

/**
 * Deletes all comments from given review.
 */
export async function deleteAllPullRequestReviewCommentsAsync(
  pull_number: number,
  review_id: number
) {
  const comments = await listPullRequestReviewCommentsAsync(pull_number, review_id);

  await Promise.all(
    comments
      .filter((comment) => comment.pull_request_review_id === review_id)
      .map((comment) => deletePullRequestReviewCommentAsync(comment.id))
  );
}

/**
 * Requests given users to review the pull request.
 * If the user already reviewed the PR, it resets his review state.
 */
export async function requestPullRequestReviewersAsync(pull_number: number, reviewers: string[]) {
  const { data } = await octokit.pulls.requestReviewers({
    owner,
    repo,
    pull_number,
    reviewers,
  });
  return data;
}

/**
 * Returns an issue object with given issue number.
 */
export async function getIssueAsync(issue_number: number) {
  const { data } = await octokit.issues.get({
    owner,
    repo,
    issue_number,
  });
  return data;
}

/**
 * Returns a list of all open issues. Limited to 10 items.
 */
export async function listAllOpenIssuesAsync({
  limit,
  offset,
  labels,
}: {
  limit?: number;
  offset?: number;
  labels?: string;
} = {}) {
  const per_page = limit ?? 10;
  const page = offset ? offset * per_page : 0;
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    per_page,
    labels,
    page,
    state: 'open',
  });
  return data;
}

/**
 * Creates an issue comment with given body.
 */
export async function createCommentAsync(issue_number: number, body: string) {
  const { data } = await octokit.issues.createComment({
    owner,
    repo,
    issue_number,
    body,
  });
  return data;
}

/**
 * Lists commits in given issue.
 */
export async function listCommentsAsync(
  issue_number: number,
  options: Partial<ListCommentsOptions>
) {
  const { data } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number,
    ...options,
  });
  return data;
}

/**
 * Returns a list of issue comments gathered from all pages.
 */
export async function listAllCommentsAsync(issue_number: number) {
  const issue = await getIssueAsync(issue_number);
  const comments = [] as ListCommentsResponse['data'];
  const pageSize = 100;

  for (let page = 1, maxPage = Math.ceil(issue.comments / pageSize); page <= maxPage; page++) {
    const commentsPage = await listCommentsAsync(issue_number, {
      page,
      per_page: pageSize,
    });
    comments.push(...commentsPage);
  }
  return comments;
}

/**
 * Deletes an issue comment with given identifier.
 */
export async function deleteCommentAsync(comment_id: number) {
  const { data } = await octokit.issues.deleteComment({
    owner,
    repo,
    comment_id,
  });
  return data;
}

/**
 * Adds labels to the issue. Throws an error when any of given labels doesn't exist.
 */
export async function addIssueLabelsAsync(issue_number: number, labels: string[]) {
  const { data } = await octokit.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels,
  });
  return data;
}

/**
 * Removes single label from the issue.
 * Throws an error when given label doesn't exist and when the label isn't added.
 */
export async function removeIssueLabelAsync(issue_number: number, name: string) {
  const { data } = await octokit.issues.removeLabel({
    owner,
    repo,
    issue_number,
    name,
  });
  return data;
}

// Octokit's types are autogenerated and so inconvenient to use if you want to refer to them.
// We re-export some of them to make it easier.
export type PullRequestReviewEvent = 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES';
export type PullRequest = RestEndpointMethodTypes['pulls']['get']['response']['data'];
export type PullRequestReview = RestEndpointMethodTypes['pulls']['getReview']['response']['data'];
export type IssueComment = RestEndpointMethodTypes['issues']['getComment']['response']['data'];
export type ListCommentsOptions = RestEndpointMethodTypes['issues']['listComments']['parameters'];
export type ListCommentsResponse = RestEndpointMethodTypes['issues']['listComments']['response'];
