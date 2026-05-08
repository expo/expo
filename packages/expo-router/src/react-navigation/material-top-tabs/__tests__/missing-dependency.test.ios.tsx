import { expect, test } from '@jest/globals';

test('throws an error when react-native-tab-view is not installed', () => {
  expect(() => require('../index')).toThrow(
    "Install 'react-native-tab-view' and 'react-native-pager-view' packages to use the Expo Router's TopTabs."
  );
});
