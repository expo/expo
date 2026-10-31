import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const GLOBAL_CSS_FILE = fileURLToPath(new URL('../styles/global.css', import.meta.url));
// Jest maps the package to mock.js, so read the real bundle.
const COOKIE_CONSENT_BUNDLE = fileURLToPath(
  new URL('../node_modules/@expo/styleguide-cookie-consent/dist/index.js', import.meta.url)
);

// DataGrail renders the banner and names its elements with dg- classes. The package styles the
// banner with the same classes, so a class the bundle does not mention no longer exists.
const COOKIE_BANNER_CLASS = /\.(dg-[\w-]+)/g;

describe('styles/global.css', () => {
  test('every cookie banner class exists in @expo/styleguide-cookie-consent', () => {
    const css = fs.readFileSync(GLOBAL_CSS_FILE, 'utf8');
    const bundle = fs.readFileSync(COOKIE_CONSENT_BUNDLE, 'utf8');
    const classNames = [...new Set([...css.matchAll(COOKIE_BANNER_CLASS)].map(match => match[1]))];
    const problems = classNames
      .filter(className => !new RegExp(`\\.${className}\\b`).test(bundle))
      .map(
        className =>
          `global.css selects .${className}, but @expo/styleguide-cookie-consent does not style it, so the rule no longer applies`
      );

    expect(classNames.length).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  });
});
