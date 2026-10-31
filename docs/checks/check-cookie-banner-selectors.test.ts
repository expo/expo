import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const GLOBAL_CSS_FILE = fileURLToPath(new URL('../styles/global.css', import.meta.url));
// Jest maps the package to mock.js, so read the real bundle.
const COOKIE_CONSENT_BUNDLE = fileURLToPath(
  new URL('../node_modules/@expo/styleguide-cookie-consent/dist/index.js', import.meta.url)
);

const COOKIE_BANNER_TEST_ID = /\[data-testid='(cookie-banner-[\w-]+)']/g;

describe('styles/global.css', () => {
  test('every cookie banner test ID exists in @expo/styleguide-cookie-consent', () => {
    const css = fs.readFileSync(GLOBAL_CSS_FILE, 'utf8');
    const bundle = fs.readFileSync(COOKIE_CONSENT_BUNDLE, 'utf8');
    const testIds = [...new Set([...css.matchAll(COOKIE_BANNER_TEST_ID)].map(match => match[1]))];
    const problems = testIds
      .filter(testId => !new RegExp(`["']${testId}["']`).test(bundle))
      .map(
        testId =>
          `global.css selects [data-testid='${testId}'], but @expo/styleguide-cookie-consent does not render it, so the rule no longer applies`
      );

    expect(testIds.length).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  });
});
