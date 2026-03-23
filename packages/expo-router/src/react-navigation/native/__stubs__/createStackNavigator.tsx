import {
  createNavigatorFactory,
  type DefaultNavigatorOptions,
  type NavigationListBase,
  type ParamListBase,
  type StackNavigationState,
  StackRouter,
  type TypedNavigator,
  useNavigationBuilder,
} from '@react-navigation/core';

const StackNavigator = (
  props: DefaultNavigatorOptions<
    ParamListBase,
    string | undefined,
    StackNavigationState<ParamListBase>,
    {},
    {},
    unknown
  >
) => {
  const { state, descriptors, NavigationContent } = useNavigationBuilder(
    StackRouter,
    props
  );

  return (
    <NavigationContent>
      {descriptors[state.routes[state.index].key].render()}
    </NavigationContent>
  );
};

export function createStackNavigator<
  ParamList extends ParamListBase,
>(): TypedNavigator<{
  ParamList: ParamList;
  NavigatorID: string | undefined;
  State: StackNavigationState<ParamList>;
  ScreenOptions: {};
  EventMap: {};
  NavigationList: NavigationListBase<ParamList>;
  Navigator: typeof StackNavigator;
}> {
  return createNavigatorFactory(StackNavigator)();
}
