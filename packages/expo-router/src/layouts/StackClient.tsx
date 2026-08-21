'use client';
import type { ComponentProps } from 'react';
import { Children, useMemo } from 'react';

import {
  createStandardNativeStackNavigator,
  type NativeStackNavigatorCreateProps,
  type StandardNativeStackEventMap,
} from '../fork/native-stack/createNativeStackNavigator';
import { useLinkPreviewContext } from '../link/preview/LinkPreviewContext';
import {
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
} from '../navigationParams';
import {
  type DescriptorRouteProp,
  type ParamListBase,
  type StackNavigationState,
  type StackRouterOptions,
} from '../react-navigation/native';
import { makePopAction, type NativeStackNavigationOptions } from '../react-navigation/native-stack';
import type { NativeStackNavigationConfig } from '../react-navigation/native-stack/types';
import { unstable_integrateWithRouter } from '../standard-navigation';
import { subscribePopToTopOnParentTabPress } from '../standard-navigation/subscribePopToTopOnParentTabPress';
import { isChildOfType } from '../utils/children';
import { Protected } from '../views/Protected';
import { StackRouter } from './stack-router';
import {
  type StackScreenProps,
  StackHeader,
  StackScreen,
  StackSearchBar,
  StackTitle,
  StackToolbar,
  appendScreenStackPropsToOptions,
  mapProtectedScreen,
  validateStackPresentation,
} from './stack-utils';

export type ExtendedStackNavigationOptions = NativeStackNavigationOptions;

const RNStack = unstable_integrateWithRouter<
  ExtendedStackNavigationOptions,
  StackNavigationState<ParamListBase>,
  StandardNativeStackEventMap,
  NativeStackNavigationConfig,
  StackRouterOptions,
  NativeStackNavigatorCreateProps
>(createStandardNativeStackNavigator, StackRouter, {
  createProps: ({ state, dispatch, navigation }) => ({
    pop: makePopAction(dispatch, state.key),
    removeRoutes: (routeNames) => dispatch({ type: 'REMOVE_ROUTES', payload: { routeNames } }),
    subscribePopToTopOnParentTabPress: () => subscribePopToTopOnParentTabPress(navigation, state),
  }),
});

/**
 * Renders a native stack navigator.
 *
 * @hideType
 */
const Stack = Object.assign(
  (props: ComponentProps<typeof RNStack>) => {
    const { isStackAnimationDisabled } = useLinkPreviewContext();

    const screenOptionsWithCompositionAPIOptions = useMemo<NativeStackScreenOptions>(() => {
      const stackHeader = Children.toArray(props.children).find((child) =>
        isChildOfType(child, StackHeader)
      );
      if (stackHeader) {
        const screenStackProps: StackScreenProps = { children: stackHeader };
        const currentOptions = props.screenOptions;
        if (currentOptions) {
          if (typeof currentOptions === 'function') {
            return (...args) => {
              const options = currentOptions(...args);
              return appendScreenStackPropsToOptions(options, screenStackProps);
            };
          }
          return appendScreenStackPropsToOptions(currentOptions, screenStackProps);
        } else {
          return appendScreenStackPropsToOptions({}, screenStackProps);
        }
      } else if (props.screenOptions) {
        const screenOptions = props.screenOptions;
        if (typeof screenOptions === 'function') {
          return validateStackPresentation(screenOptions);
        }
        return validateStackPresentation(screenOptions);
      }
      return props.screenOptions;
    }, [props.screenOptions, props.children]);

    const screenOptions = useMemo(() => {
      const condition = isStackAnimationDisabled ? () => true : shouldDisableAnimationBasedOnParams;

      return disableAnimationInScreenOptions(screenOptionsWithCompositionAPIOptions, condition);
    }, [screenOptionsWithCompositionAPIOptions, isStackAnimationDisabled]);

    const rnChildren = useMemo(
      () => mapProtectedScreen({ guard: true, children: props.children }).children,
      [props.children]
    );

    return <RNStack {...props} children={rnChildren} screenOptions={screenOptions} />;
  },
  {
    Screen: StackScreen,
    Protected,
    Header: StackHeader,
    SearchBar: StackSearchBar,
    Title: StackTitle,
    Toolbar: StackToolbar,
  }
);

type NativeStackScreenOptions = ComponentProps<typeof RNStack>['screenOptions'];

function disableAnimationInScreenOptions(
  options: NativeStackScreenOptions | undefined,
  condition: (route: DescriptorRouteProp<ParamListBase, string>) => boolean
): NativeStackScreenOptions {
  if (options && typeof options === 'function') {
    return (props) => {
      const oldOptions = options(props);
      if (condition(props.route)) {
        return {
          ...oldOptions,
          animation: 'none',
        };
      }
      return oldOptions ?? {};
    };
  }
  return (props) => {
    if (condition(props.route)) {
      return {
        ...(options ?? {}),
        animation: 'none',
      };
    }
    return options ?? {};
  };
}

function shouldDisableAnimationBasedOnParams(
  route: DescriptorRouteProp<ParamListBase, string>
): boolean {
  const expoParams = getInternalExpoRouterParams(route.params);
  return !!expoParams[INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME];
}

export { StackRouter, stackRouterOverride } from './stack-router';
export default Stack;
