import chalk from 'chalk';
import { device, expect as detoxExpect, element, by, waitFor } from 'detox';

import { getTextAsync, sleepAsync } from './Utils';

let TESTS = [
  'Basic',
  // 'Asset',
  'Constants',
  'Crypto',
  // 'GLView',
  'Haptics',
  'Localization',
  'SecureStore',
  // 'Segment',
  // 'SQLite',
  'Random',
  'Permissions',
  // 'Audio',
];

const MIN_TIME = 50000;

describe('test-suite', () => {
  TESTS.map(testName => {
    it(
      `passes ${testName}`,
      async () => {
        await device.launchApp({
          newInstance: true,
          url: `bareexpo://test-suite/select/${testName}`,
        });
        await sleepAsync(100);
        await detoxExpect(element(by.id('test_suite_container'))).toBeVisible();
        await waitFor(element(by.id('test_suite_text_results')))
          .toBeVisible()
          .withTimeout(MIN_TIME);

        const resultsString = await getTextAsync('test_suite_final_results');

        const { magic, failed, failures, results } = JSON.parse(resultsString);
        expect(magic).toBe('[TEST-SUITE-END]');
        expect(results).toBeDefined();

        const formatResults = results =>
          results &&
          results
            // Remove random "undefined" from beginning
            .substring(9)
            .replace(new RegExp('---', 'g'), chalk.cyan('---'))
            .split('+++')
            .join(chalk.red('+++'))
            .split(` ${testName} `)
            .join(chalk.magenta.bold(` ${testName} `))
            .replace(new RegExp('toBe: ', 'g'), chalk.bold.green('toBe: '));
        console.log(chalk.bgMagenta.bold.black(`\n RESULTS \n\n`), formatResults(results));

        if (failed > 0) {
          console.log(chalk.bgRed.bold.black('\n FAILED \n\n'), formatResults(failures));
        }
        expect(failed).toBe(0);
      },
      MIN_TIME * 1.5
    );
  });
});
