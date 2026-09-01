import type { SplitHostProps as ScreensSplitHostProps } from 'react-native-screens';

import type { SplitHostProps } from '../types';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export type _SplitHostPropsMatchScreens = Expect<Equal<SplitHostProps, ScreensSplitHostProps>>;

describe('split view types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
