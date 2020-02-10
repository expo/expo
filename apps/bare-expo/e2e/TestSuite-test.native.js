import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

import { getTextAsync, sleepAsync } from './Utils';
import { expectResults } from './utils/report';

let TESTS = [
  'Basic',
  // 'Asset',
  // 'FileSystem',
  // 'Font',
  'Permissions',
  'Blur',
  'LinearGradient',
  'Constants',
  // 'Contacts',
  'Crypto',
  // 'GLView',
  'Haptics',
  'Localization',
  // 'SecureStore',
  // 'Segment',
  // 'SQLite',
  'Random',
  'Permissions',
  'KeepAwake',
  'FirebaseCore',
  'FirebaseAnalytics',
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

        const input = await getTextAsync('test_suite_final_results');

        expectResults({
          testName,
          input,
        });
      },
      MIN_TIME * 1.5
    );
  });
});
