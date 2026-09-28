import type {
  DefaultNavigatorOptions,
  EventMapBase,
  NavigationState,
  ParamListBase,
  RouteGroupConfig,
} from '../../native';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type CallbackArgument<T> = T extends (arg: infer P) => unknown ? P : never;

type NavigatorOptions = DefaultNavigatorOptions<
  ParamListBase,
  undefined,
  NavigationState,
  Record<string, never>,
  EventMapBase,
  unknown
>;
type GroupOptions = RouteGroupConfig<ParamListBase, Record<string, never>, unknown>;

export type _NavigatorScreenOptionsRouteKeyMayBeUndefined = Expect<
  Equal<
    CallbackArgument<NonNullable<NavigatorOptions['screenOptions']>>['route']['key'],
    string | undefined
  >
>;
export type _GroupScreenOptionsRouteKeyMayBeUndefined = Expect<
  Equal<
    CallbackArgument<NonNullable<GroupOptions['screenOptions']>>['route']['key'],
    string | undefined
  >
>;

describe('core types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
