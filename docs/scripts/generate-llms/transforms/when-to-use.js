/**
 * Hand-authored routing guidance injected near the top of llms.txt so an agent can decide whether
 * Expo documentation is the right source before it scans the generated navigation tree.
 */
export const WHEN_TO_USE_SECTION = `## When to use Expo documentation

Use these docs when creating, upgrading, debugging, or deploying an Expo or React Native app. They are the authoritative source for Expo SDK packages, Expo Router, development builds, native modules, and EAS services such as Build, Submit, Update, Hosting, and Workflows.

For each task:

1. Find the most relevant page in this index.
2. Fetch its linked Markdown URL instead of guessing or loading the entire index into context.
3. For SDK APIs, prefer the version that matches the project's installed Expo SDK. Use the latest version only when the project is on the latest SDK or when comparing upgrade paths.

Use the [Expo MCP server](https://docs.expo.dev/mcp.md) when an agent needs live Expo account, project, build, workflow, documentation-search, or simulator access.

`;
