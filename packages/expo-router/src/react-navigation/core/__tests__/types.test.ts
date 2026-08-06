import type { NavigationState } from '../../routers';
import type {
  DefaultNavigatorOptions,
  Descriptor,
  NavigationProp,
  RouteConfigProps,
  RouteGroupConfig,
  RouteProp,
  ScreenLayoutArgs,
} from '../types';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type CallbackNavigation<T> = Parameters<Extract<T, (...args: any[]) => any>>[0] extends {
  navigation: infer Navigation;
}
  ? Navigation
  : never;

type ParamList = { index: undefined };
type State = NavigationState<ParamList>;
type Navigation = NavigationProp<ParamList>;
type Options = { title?: string };
type EventMap = { focus: { data: undefined } };

type NavigatorOptions = DefaultNavigatorOptions<
  ParamList,
  undefined,
  State,
  Options,
  EventMap,
  Navigation
>;
type ScreenProps = RouteConfigProps<ParamList, 'index', State, Options, EventMap, Navigation>;
type GroupProps = RouteGroupConfig<ParamList, Options, Navigation>;
type ScreenDescriptor = Descriptor<Options, Navigation, RouteProp<ParamList>>;

export type _NavigatorScreenOptionsNavigationCanBeUndefined = Expect<
  Equal<CallbackNavigation<NavigatorOptions['screenOptions']>, Navigation | undefined>
>;
export type _NavigatorScreenListenersNavigationCanBeUndefined = Expect<
  Equal<CallbackNavigation<NavigatorOptions['screenListeners']>, Navigation | undefined>
>;
export type _NavigatorScreenLayoutNavigationCanBeUndefined = Expect<
  Equal<CallbackNavigation<NavigatorOptions['screenLayout']>, Navigation | undefined>
>;
export type _ScreenOptionsNavigationCanBeUndefined = Expect<
  Equal<CallbackNavigation<ScreenProps['options']>, Navigation | undefined>
>;
export type _ScreenListenersNavigationCanBeUndefined = Expect<
  Equal<CallbackNavigation<ScreenProps['listeners']>, Navigation | undefined>
>;
export type _ScreenLayoutNavigationCanBeUndefined = Expect<
  Equal<CallbackNavigation<ScreenProps['layout']>, Navigation | undefined>
>;
export type _GroupScreenOptionsNavigationCanBeUndefined = Expect<
  Equal<CallbackNavigation<GroupProps['screenOptions']>, Navigation | undefined>
>;
export type _GroupScreenLayoutNavigationCanBeUndefined = Expect<
  Equal<CallbackNavigation<GroupProps['screenLayout']>, Navigation | undefined>
>;
export type _ScreenLayoutArgsNavigationCanBeUndefined = Expect<
  Equal<
    ScreenLayoutArgs<ParamList, 'index', Options, Navigation>['navigation'],
    Navigation | undefined
  >
>;
export type _DescriptorNavigationIsRequired = Expect<
  Equal<Record<never, never> extends Pick<ScreenDescriptor, 'navigation'> ? true : false, false>
>;

describe('react-navigation core types', () => {
  it('is type-checked by tsc', () => {});
});
