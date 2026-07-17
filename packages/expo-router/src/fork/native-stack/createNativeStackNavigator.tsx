'use client';
// TODO: move to createStandardNativeStackNavigator.tsx
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import * as React from 'react';
import { createStandardNavigator } from 'standard-navigation';

import { useClearGuardedRoutes } from '../../layouts/useClearGuardedRoutes';
import {
  INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME,
  type InternalNavigationOptions,
} from '../../navigationParams';
import type { ParamListBase, StackNavigationState } from '../../react-navigation/native';
import type {
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
} from '../../react-navigation/native-stack';
import { NativeStackView } from '../../react-navigation/native-stack';
import type { StandardNavigatorContentProps } from '../../standard-navigation/types';
import { CompositionContext, mergeOptions, useCompositionRegistry } from './composition-options';
import { DescriptorsContext, type NativeStackDescriptorMap } from './descriptors-context';
import { usePreviewTransition } from './usePreviewTransition';

const GLASS = isLiquidGlassAvailable();

type NativeStackNavigationOptionsWithInternal = NativeStackNavigationOptions &
  InternalNavigationOptions;

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

/**
 * Props injected into the native stack's `NavigatorContent` on top of the standard-navigation
 * `NavigatorArgs`, derived from the raw navigator state/dispatch/navigation in `StackClient`'s
 * `createProps`.
 *
 * All of these are optional on the public navigator component (the user never passes them);
 * `createProps` supplies them at runtime, so the content component asserts their presence when
 * forwarding to `NativeStackView`.
 */
export interface NativeStackContentProps {
  guardedRoutesConfig?: {
    state: StackNavigationState<ParamListBase>;
    navigation: Parameters<typeof useClearGuardedRoutes>[1];
  };
  /** Pops `count` screens starting from the screen identified by `sourceRouteKey`. */
  pop?: (count: number, sourceRouteKey: string) => void;
  /**
   * Subscribes the pop-to-top-on-tab-press behavior to the parent tab navigator, returning the
   * unsubscribe function (or `undefined` when there is no parent tab navigator).
   */
  subscribeTabPressPopToTop?: () => (() => void) | undefined;
}

type ContentArgs = StandardNavigatorContentProps<
  ExtendedStackNavigationOptions,
  NativeStackNavigationEventMap,
  NativeStackContentProps
>;

function NativeStackContent({
  state,
  descriptors,
  emitter,
  guardedRoutesConfig,
  pop,
  subscribeTabPressPopToTop,
}: ContentArgs) {
  // The standard contract narrows descriptors to `{ options, render }`, but the integration layer
  // forwards the real react-navigation descriptors at runtime (including the ones it describes for
  // the preloaded routes), so headers/screens can read `.navigation`/`.route`.
  const rnDescriptors = descriptors as unknown as NativeStackDescriptorMap;

  useClearGuardedRoutes(guardedRoutesConfig!.state, guardedRoutesConfig!.navigation);

  // When user taps on already focused tab and we're inside the tab, reset the stack to replicate
  // native behaviour. The subscription is built in `createProps`, where the parent navigation and
  // raw state are available.
  React.useEffect(() => subscribeTabPressPopToTop?.(), [subscribeTabPressPopToTop]);

  // `usePreviewTransition` wraps `emit` to track the native preview transition; the SAME wrapped
  // emit must flow into the view so transition events reach the wrapper.
  const emitterNavigation = React.useMemo(() => ({ emit: emitter.emit }), [emitter]);
  const { computedState, navigationWrapper } = usePreviewTransition(state, emitterNavigation);

  // Map internal gesture option to React Navigation's gestureEnabled option
  // This allows Expo Router to override gesture behavior without affecting user settings
  const finalDescriptors = React.useMemo(() => {
    let needsNewMap = false;
    const result: typeof rnDescriptors = {};
    for (const key of Object.keys(rnDescriptors)) {
      const descriptor = rnDescriptors[key]!;
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
    return needsNewMap ? result : rnDescriptors;
  }, [rnDescriptors]);

  const { registry, contextValue } = useCompositionRegistry();

  const mergedDescriptors = React.useMemo(
    () => mergeOptions(finalDescriptors, registry, computedState),
    [finalDescriptors, computedState, registry]
  );

  // `pop` and `subscribeTabPressPopToTop` are always supplied by `StackClient`'s `createProps`;
  // they are optional on the public component only so the user is not forced to pass them. The
  // `pop!` assertion below reflects that runtime guarantee.
  return (
    <DescriptorsContext value={rnDescriptors}>
      <CompositionContext value={contextValue}>
        <NativeStackView
          state={computedState}
          descriptors={mergedDescriptors}
          emit={navigationWrapper.emit}
          pop={pop!}
        />
      </CompositionContext>
    </DescriptorsContext>
  );
}

export const createStandardNativeStackNavigator = createStandardNavigator<
  ExtendedStackNavigationOptions,
  NativeStackNavigationEventMap,
  NativeStackContentProps
>(NativeStackContent);
