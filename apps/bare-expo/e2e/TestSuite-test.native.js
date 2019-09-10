import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

import { getTextAsync, runTestsAsync, sleepAsync } from './Utils';
import { expectResults } from './utils/report';

const TESTS = [
  {
    name: 'Sanity',
    tests: [
      // Sanity
      'Basic',
    ],
  },
  {
    name: 'Core',
    tests: [
      // Core
      'Asset',
      'Constants',
      'FileSystem',
      'Font',
      'Permissions',
    ],
  },
  // {
  //   name: 'Protected',
  //   tests: [],
  // },
  // {
  //   name: 'API',
  //   tests: [
  //     'Crypto',
  //     'Random',
  //     'Haptics',
  //     'Localization',
  //     'SecureStore',
  //     'SQLite',
  //     'Random',
  //     // 'Audio',
  //   ],
  // },
  // {
  //   name: 'Components',
  //   tests: [
  //     'GLView',
  //   ]
  // },
  // {
  //   name: 'Third-Party',
  //   tests: [
  //     'Segment',
  //   ]
  // }
];

const MIN_TIME = 50000;

runTestsAsync(TESTS, MIN_TIME * 1.5, async testName => {
  await device.launchApp({
    newInstance: true,
    url: `bareexpo://test-suite/select/${testName}`,
  });
  await sleepAsync(100);
  await detoxExpect(element(by.id('test_suite_container'))).toBeVisible();
  await waitFor(element(by.id('test_suite_text_results')))
    .toBeVisible()
    .withTimeout(MIN_TIME);

  const input = await getTextAsync('test_suite_final_results');

  expectResults({
    testName,
    input,
  });
});
