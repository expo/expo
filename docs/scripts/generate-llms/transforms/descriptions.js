/**
 * Shared blockquote intros and per-page description overrides for the
 * generated llms.txt file.
 */

export const EXPO_DESCRIPTION =
  'Expo is agentic mobile infrastructure. It provides building blocks that agents and teams can use to build, validate, deploy, and monitor mobile apps. Build with Expo CLI, Expo Skills, the Expo MCP Server, and EAS Build. Validate changes with EAS Workflows. Deploy with EAS Submit and EAS Update. Monitor production with EAS Observe. The React Native team recommends the Expo framework for production React Native apps.';

/**
 * Use `PAGE_DESCRIPTION_OVERRIDES` to ship a richer description for a
 * specific page in llms.txt without changing the live page's frontmatter.
 * The frontmatter `description` is bound by SEO meta-description length
 * limits (~155 chars); llms.txt has no such cap, so positioning-critical
 * pages can have a fuller description here.
 */

export const PAGE_DESCRIPTION_OVERRIDES = {
  '/more/expo-cli': '',
  '/router/introduction':
    'Expo Router is the default and recommended routing solution for all Expo projects. It provides file-based routing for native apps. It also provides automatic deep linking, static and server web rendering, API routes, native tabs, and more.',
};
