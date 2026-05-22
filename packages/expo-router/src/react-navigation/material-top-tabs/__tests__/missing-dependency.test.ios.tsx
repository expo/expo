import { expect, test } from '@jest/globals';

jest.mock(
  'react-native-tab-view',
  () => {
    throw new Error("Cannot find module 'react-native-tab-view'");
  },
  { virtual: true }
);

test('throws an error when react-native-tab-view is not installed', () => {
  jest.doMock('react-native-tab-view', () => {
    throw new Error();
  });
  expect(() => require('../index')).toThrow(
    "Install the 'react-native-tab-view' package and its peer dependencies to use the Expo Router's TopTabs."
  );
});
