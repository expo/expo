'use client';

import { useRoute } from '@react-navigation/native';
import { use, useEffect } from 'react';

import type { UsePreventZoomTransitionDismissalOptions } from './usePreventZoomTransitionDismissal.types';
import { ZoomTransitionTargetContext } from './zoom-transition-context';
import { DescriptorsContext } from '../../fork/native-stack/descriptors-context';
import { INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME } from '../../navigationParams';
import { useNavigation } from '../../useNavigation';

export function usePreventZoomTransitionDismissal(
  options?: UsePreventZoomTransitionDismissalOptions
) {
  const context = use(ZoomTransitionTargetContext);
  const route = useRoute();
  const navigation = useNavigation();

  const descriptorsMap = use(DescriptorsContext);
  const currentDescriptor = descriptorsMap[route.key];
  const gestureEnabled = currentDescriptor?.options?.gestureEnabled;

  useEffect(() => {
    const rect = options?.unstable_dismissalBoundsRect;

    // Validate rect if provided
    if (rect) {
      const { minX, maxX, minY, maxY } = rect;

      // Validate that max > min when both are defined
      if (minX !== undefined && maxX !== undefined && minX >= maxX) {
        console.warn('[expo-router] unstable_dismissalBoundsRect: minX must be less than maxX');
        return;
      }
      if (minY !== undefined && maxY !== undefined && minY >= maxY) {
        console.warn('[expo-router] unstable_dismissalBoundsRect: minY must be less than maxY');
        return;
      }
    }

    // Determine the final rect to use for dismissal bounds:
    // 1. If user provided a rect, use it
    // 2. If user disabled gestures entirely (gestureEnabled={false}), block the whole screen
    //    by setting impossible bounds { maxX: 0, maxY: 0 }
    // 3. Otherwise, allow normal dismissal (null rect)
    const computedRect = rect ?? (gestureEnabled === false ? { maxX: 0, maxY: 0 } : null);

    context.setDismissalBoundsRect?.(computedRect);

    // Disable React Navigation's gesture handler when we have custom bounds to prevent conflicts.
    // The native zoom transition's interactiveDismissShouldBegin callback handles dismissal instead.
    // We use the internal option to preserve the user's gestureEnabled setting.
    navigation.setOptions({
      [INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME]: computedRect ? false : undefined,
    });

    // Cleanup on unmount
    return () => {
      context.setDismissalBoundsRect?.(null);
    };
  }, [
    options?.unstable_dismissalBoundsRect?.minX,
    options?.unstable_dismissalBoundsRect?.maxX,
    options?.unstable_dismissalBoundsRect?.minY,
    options?.unstable_dismissalBoundsRect?.maxY,
    context.setDismissalBoundsRect,
    gestureEnabled,
    navigation,
  ]);
}
