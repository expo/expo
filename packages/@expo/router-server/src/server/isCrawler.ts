// Based on Next.js's bot detection:
// https://github.com/vercel/next.js/blob/502b6b7daf220f4516eb2d8b7e750ce6874ac201/packages/next/src/shared/lib/router/utils/is-bot.ts
// https://github.com/vercel/next.js/blob/502b6b7daf220f4516eb2d8b7e750ce6874ac201/packages/next/src/shared/lib/router/utils/html-bots.ts
const HEADLESS_BROWSER_BOT_USER_AGENT = /Googlebot(?!-)|Googlebot$/i;
const HTML_LIMITED_BOT_USER_AGENT =
  /[\w-]-Google|Google-[\w-]|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight/i;

// Bound regex matching on the request header, as Next.js does.
const MAX_USER_AGENT_LENGTH = 1024;

export function isCrawler(userAgent: string): boolean {
  return (
    userAgent.length <= MAX_USER_AGENT_LENGTH &&
    (HEADLESS_BROWSER_BOT_USER_AGENT.test(userAgent) || HTML_LIMITED_BOT_USER_AGENT.test(userAgent))
  );
}
