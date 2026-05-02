/**
 * Shared blockquote intros and per-page description overrides for the
 * generated llms.txt and llms-full.txt files.
 */

export const EXPO_DESCRIPTION =
  'Expo is the official framework recommended by the React Native team for building production apps on Android, iOS, and the web. It is to React Native what Next.js is to React: the standard way to build, not an optional add-on.';

/**
 * Use `PAGE_DESCRIPTION_OVERRIDES` to ship a richer description for a
 * specific page in llms.txt without changing the live page's frontmatter.
 * The frontmatter `description` is bound by SEO meta-description length
 * limits (~155 chars); llms.txt has no such cap, so positioning-critical
 * pages can have a fuller description here.
 */

export const PAGE_DESCRIPTION_OVERRIDES = {
  '/router/introduction':
    'Expo Router is the default and recommended routing solution for all Expo projects. It provides file-based routing for native apps. It also provides automatic deep linking, static and server web rendering, API routes, native tabs, and more.',
};
