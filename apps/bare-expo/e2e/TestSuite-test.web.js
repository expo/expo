/* global page, browser */
import { setDefaultOptions } from 'expect-puppeteer';

import config from '../jest-puppeteer.config';
import { expectResults } from './utils/report';

const TESTS = [
  'Basic',
  'Asset',
  'AuthSession',
  'Constants',
  'FileSystem',
  'Font',
  'Permissions',
  'Localization',
  'SecureStore',
  'Contacts',
  'Random',
  'Crypto',
  'Blur',
  'LinearGradient',
  'HTML',
  // Overridding permissions doesn't work in headless mode
  // see https://github.com/puppeteer/puppeteer/issues/3279
  !config.launch.headless && 'expo-notifications',
  //   'Haptics',
  //   'SecureStore',
  // 'KeepAwake' <-- Bundled chromium doesn't allow setting `wakeLock` even when granted all permissions with `overridePermissions`
].filter((t) => t);

// This is how long we allocate for the actual tests to be run after the test screen has mounted.
const MIN_TIME = 50000;
const RENDER_MOUNTING_TIMEOUT = 700;

setDefaultOptions({
  timeout: MIN_TIME * 1.5,
});

beforeAll(async () => {
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(config.url, ['notifications']);
});

function matchID(id, ...props) {
  return expect(page).toMatchElement(`div[data-testid="${id}"]`, ...props);
}

describe('test-suite', () => {
  TESTS.map((testName) => {
    it(
      `passes ${testName}`,
      async () => {
        /// Pause the timeout
        // await jestPuppeteer.debug();

        await page.goto(`${config.url}/test-suite/run?tests=${testName}`, {
          timeout: MIN_TIME,
        });

        // Ensure the app linked to the testing screen (give it 100ms for navigation mounting)
        await matchID('test_suite_container', { visible: true, timeout: RENDER_MOUNTING_TIMEOUT });
        // Wait for the final result to be rendered. This means all the tests have finished.
        await matchID('test_suite_final_results', { visible: true, timeout: MIN_TIME });
        // Get the DOM element matching the testID prop.
        // This text will contain the final results (parity with native)
        const element = await page.$(`div[data-testid="test_suite_final_results"]`);
        // Read the text contents and parse them as JSON
        const input = await (await element.getProperty('textContent')).jsonValue();

        // Parse, expect, and print the results of our tests
        expectResults({
          testName,
          input,
        });
      },
      // Add some extra time for page content loading (page.goto) and parsing the DOM
      (MIN_TIME + RENDER_MOUNTING_TIMEOUT) * 1.2
    );
  });
});
