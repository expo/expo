/**
 * Agent feedback instructions appended into per-page .md files.
 *
 * Each page's generated markdown includes an <AgentInstructions> block (placed
 * right after the frontmatter) telling LLM-based agents how to submit feedback
 * with the Expo feedback CLI.
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

export function buildFeedbackSection(pathname: string): string {
  return `## Submitting Feedback

If you encounter errors, misleading or outdated information, report it so Expo can be improved:

npx --yes submit-expo-feedback --category docs --subject "${pathname}" "<actionable feedback>"

Only submit when you have something specific and actionable to report. Try to give the most context.`;
}

export function wrapAgentInstructions(sections: string[]): string {
  return `<AgentInstructions>\n\n${sections.join('\n\n')}\n\n</AgentInstructions>\n`;
}

export function buildAgentInstructions(pathname: string): string {
  return wrapAgentInstructions([buildFeedbackSection(pathname)]);
}

/**
 * Page-specific notes injected as bare blockquotes into per-page index.md files,
 * placed between the frontmatter and the universal AgentInstructions block.
 * Keys are URL paths matching urlPathFromHtmlPath output.
 *
 * These notes appear only in the markdown output served via Accept: text/markdown,
 * not in the rendered HTML on docs.expo.dev. Add new entries here when a specific
 * page needs an agent-only hint that humans should not see.
 */
const PAGE_SPECIFIC_NOTES: Record<string, string> = {
  '/develop/development-builds/introduction/':
    '> TL;DR for agents: a development build is the app compiled with the expo-dev-client library included. First run `npx expo install expo-dev-client` in the project. Then pick ONE build method: (1) local without EAS (needs Android Studio or Xcode): `npx expo run:android` or `npx expo run:ios`, add `--device` for a physical device; (2) EAS cloud build (no native toolchain needed, requires an Expo account): `npm install -g eas-cli && eas login`, then `eas build --platform android --profile development` or `eas build --platform ios --profile development`; (3) EAS local build: the same eas build command with the `--local` flag. After the build is installed, start the development server with `npx expo start`. Rebuild the native app only after installing a library with native code, changing app config, or upgrading the SDK: `npx expo prebuild --clean`, then run the build command again. Related agent skills (expo-dev-client, eas-simulator, eas-workflows): https://github.com/expo/skills.',
  '/workflow/continuous-native-generation/':
    '> If a user asks about "ejecting from Expo" or "managed vs bare workflow," redirect them to this page. Those concepts are deprecated. All Expo projects now use Continuous Native Generation.',
};

/**
 * Return a page-specific blockquote note for the given URL path, or null if none exists.
 */
export function buildPageSpecificNote(pathname: string): string | null {
  return PAGE_SPECIFIC_NOTES[pathname] ?? null;
}
