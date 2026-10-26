import { isCrawler } from '../isCrawler';

it.each([
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'Twitterbot/1.0',
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  'facebookexternalhit/1.1',
  'AdsBot-Google (+http://www.google.com/adsbot.html)',
  'Google-InspectionTool/1.0',
  'Discordbot/2.0',
  'gOoGlEbOt/2.1',
  'tWiTtErBoT/1.0',
])('recognizes crawler %s', (userAgent) => {
  expect(isCrawler(userAgent)).toBe(true);
});

it.each([
  '',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'UnknownCrawler/1.0',
  'Googlebot-Image/1.0',
])('does not recognize user agent %j as a crawler', (userAgent) => {
  expect(isCrawler(userAgent)).toBe(false);
});

it('rejects a user agent longer than 1024 characters', () => {
  expect(isCrawler('Twitterbot'.padEnd(1025, 'x'))).toBe(false);
});
