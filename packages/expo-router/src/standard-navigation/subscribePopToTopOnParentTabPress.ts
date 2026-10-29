import {
  type NavigationHelpers,
  type NavigationState,
  type ParamListBase,
  StackActions,
} from '../react-navigation/native';

export function subscribePopToTopOnParentTabPress(
  navigation: NavigationHelpers<ParamListBase>,
  state: NavigationState
) {
  // @ts-expect-error: there may not be a tab navigator in parent
  return navigation.addListener?.('tabPress', (event) => {
    const isFocused = navigation.isFocused();

    requestAnimationFrame(() => {
      if (
        state.index > 0 &&
        isFocused &&
        !event.defaultPrevented &&
        event.data?.__internalTabsType !== 'native'
      ) {
        navigation.dispatch({ ...StackActions.popToTop(), target: state.key });
      }
    });
  });
}
