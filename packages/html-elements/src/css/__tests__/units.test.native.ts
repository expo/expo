import { PixelRatio } from 'react-native';

import { em, rem } from '../units';

it('does not apply the system font scale on native', () => {
  jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(2);
  expect(rem(1)).toBe(16);
  expect(em(1.5)).toBe(24);
});
