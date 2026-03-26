import { expect, test } from '@jest/globals';

test('throws an error when react-native-tab-view is not installed', () => {
  expect(() => require('../index')).toThrow(
    "Install the 'react-native-tab-view' package and its peer dependencies to use the MaterialTopTabs."
  );
});
