import { isLiquidGlassAvailable } from 'expo-glass-effect';
import * as React from 'react';
import { createStandardNavigator } from 'standard-navigation';

import { useClearGuardedRoutes } from '../../layouts/useClearGuardedRoutes';
import {
  INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME,
  type InternalNavigationOptions,
} from '../../navigationParams';
import {
  NativeStackView,
  type NativeStackDescriptorMap,
  type NativeStackNavigationEventMap,
  type NativeStackNavigationOptions,
} from '../../react-navigation/native-stack';
import type { NavigatorContentProps } from '../../standard-navigation';
import { CompositionContext, mergeOptions, useCompositionRegistry } from './composition-options';
import { DescriptorsContext } from './descriptors-context';
import { usePreviewTransition } from './usePreviewTransition';

const GLASS = isLiquidGlassAvailable();

type NativeStackNavigationOptionsWithInternal = NativeStackNavigationOptions &
  InternalNavigationOptions;

export interface NativeStackNavigatorCreateProps {
  pop: (count: number, sourceRouteKey: string) => void;
  removeRoutes: (routeNames: string[]) => void;
  /** Registers pop-to-top on parent tab press, or returns undefined without a tab parent. */
  subscribePopToTopOnParentTabPress: () => (() => void) | undefined;
}

export type StandardNativeStackEventMap = {
  [Event in keyof NativeStackNavigationEventMap]: NativeStackNavigationEventMap[Event] & {
    canPreventDefault: false;
  };
};

type ContentArgs = NavigatorContentProps<
  NativeStackNavigationOptions,
  StandardNativeStackEventMap,
  object,
  NativeStackNavigatorCreateProps
>;

function NativeStackNavigatorContent({
  state,
  descriptors,
  emitter,
  pop,
  removeRoutes,
  subscribePopToTopOnParentTabPress,
}: ContentArgs) {
  const fullDescriptors = descriptors as unknown as NativeStackDescriptorMap;

  useClearGuardedRoutes(removeRoutes);
  React.useEffect(() => subscribePopToTopOnParentTabPress(), [subscribePopToTopOnParentTabPress]);

  const { computedState, emit } = usePreviewTransition(state, emitter.emit);

  // Map internal gesture option to React Navigation's gestureEnabled option
  // This allows Expo Router to override gesture behavior without affecting user settings
  const finalDescriptors = React.useMemo(() => {
    let needsNewMap = false;
    const result: NativeStackDescriptorMap = {};
    for (const key of Object.keys(fullDescriptors)) {
      const descriptor = fullDescriptors[key]!;
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
    return needsNewMap ? result : fullDescriptors;
  }, [fullDescriptors]);
  const { registry, contextValue } = useCompositionRegistry();

  const mergedDescriptors = React.useMemo(
    () => mergeOptions(finalDescriptors, registry, computedState),
    [finalDescriptors, computedState, registry]
  );

  return (
    <DescriptorsContext value={fullDescriptors}>
      <CompositionContext value={contextValue}>
        <NativeStackView
          state={computedState}
          descriptors={mergedDescriptors}
          emit={emit}
          pop={pop}
        />
      </CompositionContext>
    </DescriptorsContext>
  );
}

export const createStandardNativeStackNavigator = createStandardNavigator<
  NativeStackNavigationOptions,
  StandardNativeStackEventMap,
  NativeStackNavigatorCreateProps
>(NativeStackNavigatorContent);
