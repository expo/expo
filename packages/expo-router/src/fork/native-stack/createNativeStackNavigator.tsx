import {
  createNavigatorFactory,
  type EventArg,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StackActionHelpers,
  StackActions,
  type StackNavigationState,
  StackRouter,
  type StackRouterOptions,
  type StaticConfig,
  type TypedNavigator,
  useNavigationBuilder,
} from '@react-navigation/native';
import {
  type NativeStackNavigationEventMap,
  type NativeStackNavigationOptions,
  type NativeStackNavigationProp,
  NativeStackView,
  type NativeStackNavigatorProps,
} from '@react-navigation/native-stack';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import * as React from 'react';

import { DescriptorsContext } from './descriptors-context';
import { usePreviewTransition } from './usePreviewTransition';
import {
  INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME,
  type InternalNavigationOptions,
} from '../../navigationParams';

const GLASS = isLiquidGlassAvailable();

type NativeStackNavigationOptionsWithInternal = NativeStackNavigationOptions &
  InternalNavigationOptions;

function NativeStackNavigator({
  id,
  initialRouteName,
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  UNSTABLE_router,
  ...rest
}: NativeStackNavigatorProps) {
  const { state, describe, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    StackNavigationState<ParamListBase>,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    NativeStackNavigationOptionsWithInternal,
    NativeStackNavigationEventMap
  >(StackRouter, {
    id,
    initialRouteName,
    children,
    layout,
    screenListeners,
    screenOptions,
    screenLayout,
    UNSTABLE_router,
  });

  React.useEffect(
    () =>
      // @ts-expect-error: there may not be a tab navigator in parent
      navigation?.addListener?.('tabPress', (e: any) => {
        const isFocused = navigation.isFocused();

        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
          if (state.index > 0 && isFocused && !(e as EventArg<'tabPress', true>).defaultPrevented) {
            // When user taps on already focused tab and we're inside the tab,
            // reset the stack to replicate native behaviour
            // START FORK
            // navigation.dispatch({
            //   ...StackActions.popToTop(),
            //   target: state.key,
            // });
            // The popToTop will be automatically triggered on native side for native tabs
            if (e.data?.__internalTabsType !== 'native') {
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: state.key,
              });
            }
            // END FORK
          }
        });
      }),
    [navigation, state.index, state.key]
  );

  // START FORK
  const { computedState, computedDescriptors, navigationWrapper } = usePreviewTransition(
    state,
    navigation,
    descriptors,
    describe
  );

  // Map internal gesture option to React Navigation's gestureEnabled option
  // This allows Expo Router to override gesture behavior without affecting user settings
  const finalDescriptors = React.useMemo(() => {
    let needsNewMap = false;
    const result: typeof computedDescriptors = {};
    for (const key of Object.keys(computedDescriptors)) {
      const descriptor = computedDescriptors[key];
      const options = descriptor.options as NativeStackNavigationOptionsWithInternal;
      const internalGestureEnabled = options?.[INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME];
      const needsGestureFix = internalGestureEnabled !== undefined;
      const needsGlassFix = GLASS && options?.presentation === 'formSheet';

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
    return needsNewMap ? result : computedDescriptors;
  }, [computedDescriptors]);
  // END FORK

  return (
    // START FORK
    <DescriptorsContext value={descriptors}>
      {/* END FORK */}
      <NavigationContent>
        <NativeStackView
          {...rest}
          // START FORK
          state={computedState}
          navigation={navigationWrapper}
          descriptors={finalDescriptors}
          // state={state}
          // navigation={navigation}
          // descriptors={descriptors}
          // END FORK
          describe={describe}
        />
      </NavigationContent>
      {/* START FORK */}
    </DescriptorsContext>
    // END FORK
  );
}

export function createNativeStackNavigator<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: StackNavigationState<ParamList>;
    ScreenOptions: NativeStackNavigationOptions;
    EventMap: NativeStackNavigationEventMap;
    NavigationList: {
      [RouteName in keyof ParamList]: NativeStackNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof NativeStackNavigator;
  },
  const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
  return createNavigatorFactory(NativeStackNavigator)(config);
}
