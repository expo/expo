import type { ScreenProps } from '../useScreens';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type CallbackArgument<T> = T extends (arg: infer P) => unknown ? P : never;

export type _ScreenOptionsRouteKeyMayBeUndefined = Expect<
  Equal<CallbackArgument<NonNullable<ScreenProps['options']>>['route']['key'], string | undefined>
>;

describe('public types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
