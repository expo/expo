import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

import { sleepAsync } from './Utils';
import { expectResults } from './utils/report';

const NUM_TESTS = 67;
const MIN_TIME = 50000;

test(
  'test-suite',
  async () => {
    const platform = device.getPlatform();
    await device.launchApp({
      newInstance: true,
      url: `bareexpo://test-suite/all`,
    });

    const launchWaitingTime = platform === 'ios' ? 100 : 3000;
    await sleepAsync(launchWaitingTime);

    await detoxExpect(element(by.id('test_suite_container'))).toExist();
    try {
      await waitFor(element(by.id('test_suite_text_results')))
        .toExist()
        .withTimeout(MIN_TIME);
    } catch (err) {
      // test hasn't completed within the timeout
      // continue and log the intermediate results
    }

    if (platform === 'ios') {
      const attributes = await element(by.id('test_suite_final_results')).getAttributes();
      const input = attributes.text;
      expectResults({
        testName,
        input,
      });
    } else {
      // Platforms do no support `getAttributes()`, using text matching instead
      await detoxExpect(element(by.id('test_suite_text_results'))).toHaveText(
        'Complete: 0 tests failed.'
      );
    }
  },
  MIN_TIME * 1.5 * NUM_TESTS
);
