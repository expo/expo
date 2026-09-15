import type { ComponentProps } from 'react';

import type { Stack as JSStack } from '../layouts/JSStack';
import type { ScreenProps } from '../useScreens';
import type { Navigator, Slot } from '../views/Navigator';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type CallbackArgument<T> = T extends (arg: infer P) => unknown ? P : never;

export type _ScreenOptionsRouteKeyMayBeUndefined = Expect<
  Equal<CallbackArgument<NonNullable<ScreenProps['options']>>['route']['key'], string | undefined>
>;

export type _NavigatorLacksInitialRouteName = Expect<
  Equal<'initialRouteName' extends keyof ComponentProps<typeof Navigator> ? true : false, false>
>;
export type _SlotLacksInitialRouteName = Expect<
  Equal<'initialRouteName' extends keyof ComponentProps<typeof Slot> ? true : false, false>
>;
export type _JSStackLacksInitialRouteName = Expect<
  Equal<'initialRouteName' extends keyof ComponentProps<typeof JSStack> ? true : false, false>
>;

describe('public types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
