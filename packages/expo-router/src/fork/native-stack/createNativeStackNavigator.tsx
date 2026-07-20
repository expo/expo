import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useMemo } from 'react';
import { createStandardNavigator } from 'standard-navigation';

import { useClearGuardedRoutes } from '../../layouts/useClearGuardedRoutes';
import { INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME } from '../../navigationParams';
import {
  type EventArg,
  type NavigationProp,
  type NavigationState,
  type ParamListBase,
  type StackActionHelpers,
  type StackNavigationState,
  StackActions,
  StackRouter,
  type StackRouterOptions,
} from '../../react-navigation/native';
import {
  makePopAction,
  NativeStackView,
  type InternalNativeStackNavigationEventMap,
  type NativeStackNavigationOptions,
  type NativeStackNavigationProp,
} from '../../react-navigation/native-stack';
import {
  type NavigatorContentProps,
  unstable_integrateWithRouter,
} from '../../standard-navigation';
import { CompositionContext, mergeOptions, useCompositionRegistry } from './composition-options';
import { DescriptorsContext } from './descriptors-context';
import { usePreviewTransition } from './usePreviewTransition';

const GLASS = isLiquidGlassAvailable();

type ParentTabEventMap = {
  tabPress: {
    data: { __internalTabsType?: 'native' } | undefined;
    canPreventDefault: true;
  };
};

type TabPressEvent = EventArg<'tabPress', true, ParentTabEventMap['tabPress']['data']>;

type NativeStackCreateProps = {
  pop: (count: number, sourceRouteKey: string) => void;
  popToTop: () => void;
  removeRoutesFromState: (routeNames: string[]) => void;
  subscribeTabPress: (callback: (event: TabPressEvent, isFocused: boolean) => void) => () => void;
  getRouteNavigation: (routeKey: string) => NativeStackNavigationProp<ParamListBase>;
};

type NativeStackContentProps<Options extends NativeStackNavigationOptions> = NavigatorContentProps<
  Options,
  InternalNativeStackNavigationEventMap,
  object,
  NativeStackCreateProps
>;

function NativeStackContent<Options extends NativeStackNavigationOptions>({
  state,
  descriptors,
  emitter,
  pop,
  popToTop,
  removeRoutesFromState,
  subscribeTabPress,
  getRouteNavigation,
}: NativeStackContentProps<Options>) {
  useClearGuardedRoutes(removeRoutesFromState);

  useEffect(
    () =>
      subscribeTabPress((event, isFocused) => {
        requestAnimationFrame(() => {
          if (
            state.index > 0 &&
            isFocused &&
            !event.defaultPrevented &&
            event.data?.__internalTabsType !== 'native'
          ) {
            popToTop();
          }
        });
      }),
    [popToTop, state.index, subscribeTabPress]
  );

  const { computedState, navigationWrapper } = usePreviewTransition(state, emitter);

  const finalDescriptors = useMemo(() => {
    let needsNewMap = false;
    const result: typeof descriptors = {};
    for (const key of Object.keys(descriptors)) {
      const descriptor = descriptors[key]!;
      const options = descriptor.options;
      const internalGestureEnabled =
        INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME in options
          ? options[INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME]
          : undefined;
      const needsGestureFix = typeof internalGestureEnabled === 'boolean';
      const needsGlassFix = GLASS && options.presentation === 'formSheet';

      if (needsGestureFix || needsGlassFix) {
        needsNewMap = true;
        const newOptions = { ...options };
        if (needsGestureFix) {
          newOptions.gestureEnabled = internalGestureEnabled;
        }
        if (needsGlassFix) {
          newOptions.headerTransparent ??= true;
          newOptions.contentStyle ??= { backgroundColor: 'transparent' };
          newOptions.headerShadowVisible ??= false;
          newOptions.headerLargeTitleShadowVisible ??= false;
        }
        result[key] = { ...descriptor, options: newOptions };
      } else {
        result[key] = descriptor;
      }
    }
    return needsNewMap ? result : descriptors;
  }, [descriptors]);
  const { registry, contextValue } = useCompositionRegistry();
  const mergedDescriptors = useMemo(
    () => mergeOptions(finalDescriptors, registry, computedState),
    [finalDescriptors, computedState, registry]
  );

  return (
    <DescriptorsContext value={descriptors}>
      <CompositionContext value={contextValue}>
        <NativeStackView
          state={computedState}
          descriptors={mergedDescriptors}
          emit={navigationWrapper.emit}
          pop={pop}
          getRouteNavigation={getRouteNavigation}
        />
      </CompositionContext>
    </DescriptorsContext>
  );
}

export function createNativeStackNavigator<
  Options extends NativeStackNavigationOptions = NativeStackNavigationOptions,
>() {
  const nativeStackNavigator = createStandardNavigator<
    Options,
    InternalNativeStackNavigationEventMap,
    NativeStackCreateProps
  >(NativeStackContent<Options>);

  const IntegratedNativeStack = unstable_integrateWithRouter<
    Options,
    StackNavigationState<ParamListBase>,
    InternalNativeStackNavigationEventMap,
    object,
    StackRouterOptions,
    NativeStackCreateProps,
    StackActionHelpers<ParamListBase>
  >(nativeStackNavigator, StackRouter, {
    createProps: ({ state, dispatch, navigation, descriptors }) => ({
      pop: makePopAction(dispatch, state.key),
      popToTop: () =>
        dispatch({
          ...StackActions.popToTop(),
          target: state.key,
        }),
      removeRoutesFromState: (routeNames) =>
        dispatch({ type: 'REMOVE_ROUTES', payload: { routeNames } }),
      subscribeTabPress: (callback) => {
        const parent =
          navigation.getParent<
            NavigationProp<
              ParamListBase,
              string,
              undefined,
              NavigationState,
              object,
              ParentTabEventMap
            >
          >();
        return (
          parent?.addListener('tabPress', (event) => callback(event, navigation.isFocused())) ??
          (() => {})
        );
      },
      getRouteNavigation: (routeKey) => descriptors[routeKey]!.navigation,
    }),
  });

  return {
    Navigator: IntegratedNativeStack,
  };
}
