import {
  createNavigatorFactory,
  type DefaultNavigatorOptions,
  type EventMapBase,
  type NavigationListBase,
  type ParamListBase,
  type StackNavigationState,
  StackRouter,
  type TypedNavigator,
  useNavigationBuilder,
} from '../../core';

const StackNavigator = (
  props: DefaultNavigatorOptions<
    ParamListBase,
    string | undefined,
    StackNavigationState<ParamListBase>,
    object,
    EventMapBase,
    unknown
  >
) => {
  const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

  return (
    <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
  );
};

export function createStackNavigator<ParamList extends ParamListBase>(): TypedNavigator<{
  ParamList: ParamList;
  NavigatorID: string | undefined;
  State: StackNavigationState<ParamList>;
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  ScreenOptions: {};
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  EventMap: {};
  NavigationList: NavigationListBase<ParamList>;
  Navigator: typeof StackNavigator;
}> {
  return createNavigatorFactory(StackNavigator)();
}
