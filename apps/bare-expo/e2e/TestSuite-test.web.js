/* global page */
import { setDefaultOptions } from 'expect-puppeteer';

import config from '../jest-puppeteer.config';
import { expectResults } from './utils/report';

const sleepAsync = t => new Promise(res => setTimeout(res, t));

let TESTS = [
  'Basic',
  'Constants',
  'Crypto',
  //   'Haptics',
  'Localization',
  //   'SecureStore',
  'Random',
  //   'Permissions',
];

const MIN_TIME = 50000;

setDefaultOptions({
  timeout: MIN_TIME * 1.5,
});

function matchID(id, ...props) {
  return expect(page).toMatchElement(`div[data-testid="${id}"]`, ...props);
}

describe('test-suite', () => {
  TESTS.map(testName => {
    it(
      `passes ${testName}`,
      async () => {
        /// Pause the timeout
        // await jestPuppeteer.debug();

        await page.goto(`${config.url}/test-suite/select/${testName}`);
        await sleepAsync(100);
        await matchID('test_suite_container', { visible: true });
        await matchID('test_suite_text_results', { visible: true, timeout: MIN_TIME });
        await matchID('test_suite_text_results', { visible: true, timeout: MIN_TIME });
        await matchID('test_suite_final_results', { visible: true });
        const element = await page.$(`div[data-testid="test_suite_final_results"]`);
        const input = await (await element.getProperty('textContent')).jsonValue();

        expectResults({
          testName,
          input,
        });
      },
      MIN_TIME * 1.5
    );
  });
});
