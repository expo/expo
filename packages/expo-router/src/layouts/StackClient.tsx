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
  type ParamListBase,
  type RouteProp,
  StackActions,
  type StackNavigationState,
  type StackRouterOptions,
} from '../react-navigation/native';
import { makePopAction, type NativeStackNavigationOptions } from '../react-navigation/native-stack';
import { unstable_integrateWithRouter } from '../standard-navigation';
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

/**
 * We extend NativeStackNavigationOptions with our custom props
 * to allow for several extra props to be used on web, like modalWidth
 */
export type ExtendedStackNavigationOptions = NativeStackNavigationOptions & {
  webModalStyle?: {
    /**
     * Override the width of the modal (px or percentage). Only applies on web platform.
     * @platform web
     */
    width?: number | string;
    /**
     * Override the height of the modal (px or percentage). Applies on web desktop.
     * @platform web
     */
    height?: number | string;
    /**
     * Minimum height of the desktop modal (px or percentage). Overrides the default 640px clamp.
     * @platform web
     */
    minHeight?: number | string;
    /**
     * Minimum width of the desktop modal (px or percentage). Overrides the default 580px.
     * @platform web
     */
    minWidth?: number | string;
    /**
     * Override the border of the desktop modal (any valid CSS border value, e.g. '1px solid #ccc' or 'none').
     * @platform web
     */
    border?: string;
    /**
     * Override the overlay background color (any valid CSS color or rgba/hsla value).
     * @platform web
     */
    overlayBackground?: string;
    /**
     * Override the modal shadow filter (any valid CSS filter value, e.g. 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' or 'none').
     * @platform web
     */
    shadow?: string;
  };
};

const RNStack = unstable_integrateWithRouter<
  ExtendedStackNavigationOptions,
  StackNavigationState<ParamListBase>,
  StandardNativeStackEventMap,
  object,
  StackRouterOptions,
  NativeStackNavigatorCreateProps
>(createStandardNativeStackNavigator, StackRouter, {
  createProps: ({ state, dispatch, navigation }) => ({
    pop: makePopAction(dispatch, state.key),
    removeRoutes: (routeNames) => dispatch({ type: 'REMOVE_ROUTES', payload: { routeNames } }),
    subscribePopToTopOnParentTabPress: () =>
      // @ts-expect-error: there may not be a tab navigator in parent
      navigation.addListener?.('tabPress', (e) => {
        const isFocused = navigation.isFocused();
        requestAnimationFrame(() => {
          if (
            state.index > 0 &&
            isFocused &&
            !e.defaultPrevented &&
            e.data?.__internalTabsType !== 'native'
          ) {
            dispatch({ ...StackActions.popToTop(), target: state.key });
          }
        });
      }),
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
  condition: (route: RouteProp<ParamListBase, string>) => boolean
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

function shouldDisableAnimationBasedOnParams(route: RouteProp<ParamListBase, string>): boolean {
  const expoParams = getInternalExpoRouterParams(route.params);
  return !!expoParams[INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME];
}

export { StackRouter, stackRouterOverride } from './stack-router';
export default Stack;
