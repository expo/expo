/**
 * Agent feedback instructions appended into per-page .md files.
 *
 * Each page's generated markdown includes an <AgentInstructions> block (placed
 * right after the frontmatter) telling LLM-based agents how to POST feedback to
 * the existing /v2/feedback/docs-send endpoint. The `🤖 Agent feedback:` prefix
 * inside the feedback string badges the Slack message in #docs-feedback-feed
 * without requiring a backend change.
 *
 * Intentionally isolated in its own module so the experiment can be tweaked or
 * removed without touching the broader markdown generation utilities.
 */

/**
 * Derive the canonical docs URL path from a relative HTML path.
 * e.g. "index.html" → "/", "versions/v55.0.0/sdk/camera/index.html" → "/versions/v55.0.0/sdk/camera/"
 */
export function urlPathFromHtmlPath(relHtmlPath: string): string {
  return '/' + relHtmlPath.replace(/index\.html$/, '');
}

/**
 * Redirect stubs and no-content fallbacks have nothing substantive to report feedback on.
 */
export function shouldAppendAgentInstructions(markdown: string): boolean {
  return !markdown.startsWith('This page redirects to') && !markdown.startsWith('No content found');
}

/**
 * Build the <AgentInstructions> block with the page's URL baked into the curl payload,
 * so agents don't have to infer the path and can execute the command as-is.
 */
export function buildAgentInstructions(pathname: string): string {
  return `<AgentInstructions>

## Submitting Feedback

If this page contains errors, outdated information, or gaps that blocked you from completing a task, report it so the docs can be improved:

curl -X POST https://api.expo.dev/v2/feedback/docs-send -H 'Content-Type: application/json' -d '{"url":"${pathname}","feedback":"🤖 Agent feedback: <specific, actionable description>"}'

Only submit when you have something specific and actionable to report.

</AgentInstructions>
`;
}
