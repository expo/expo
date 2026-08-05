import { afterEach, expect, jest, test } from '@jest/globals';
import { Platform } from 'react-native';

import { getShadowStyle } from '../getShadowStyle';

const setPlatform = (platform: 'ios' | 'android' | 'web') => {
  jest.replaceProperty(Platform, 'OS', platform);
  jest.spyOn(Platform, 'select').mockImplementation((obj) =>
    // @ts-expect-error: 'default' is valid but missing in the type
    obj[platform] !== undefined ? obj[platform] : obj.default
  );
};

afterEach(() => {
  jest.restoreAllMocks();
});

test('returns web shadow styles', () => {
  setPlatform('web');

  const result = getShadowStyle({
    offset: {
      width: 2,
      height: 4,
    },
    radius: 5,
    opacity: 0.3,
  });

  expect(result).toEqual({
    boxShadow: '2px 4px 5px rgba(0, 0, 0, 0.3)',
  });
});

test('returns native shadow styles', () => {
  setPlatform('ios');

  const result = getShadowStyle({
    offset: {
      width: 2,
      height: 4,
    },
    radius: 5,
    opacity: 0.3,
  });

  expect(result).toEqual({
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowRadius: 5,
    shadowOpacity: 0.3,
  });
});
