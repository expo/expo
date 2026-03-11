import type { ParamListBase, StackNavigationState } from '@react-navigation/native';
import * as React from 'react';

import type { NativeStackDescriptor, NativeStackDescriptorMap } from './descriptors-context';
import { useLinkPreviewContext } from '../../link/preview/LinkPreviewContext';

/** Mirrors the `describe` function returned by `useNavigationBuilder` */
type DescribeFn = (
  route: StackNavigationState<ParamListBase>['preloadedRoutes'][number],
  placeholder: boolean
) => NativeStackDescriptor;

/**
 * Manages the preview transition state for link previews.
 *
 * Tracks when a preloaded screen is transitioning on the native side (after
 * the preview is committed) but before React Navigation state is updated.
 * During this window, the hook synthesizes state/descriptors to keep native
 * and JS state in sync.
 */
export function usePreviewTransition<TNavigation extends { emit: (...args: any[]) => any }>(
  state: StackNavigationState<ParamListBase>,
  navigation: TNavigation,
  descriptors: NativeStackDescriptorMap,
  describe: DescribeFn
) {
  const { openPreviewKey, setOpenPreviewKey } = useLinkPreviewContext();

  // Track the preview screen currently transitioning on the native side
  const [previewTransitioningScreenId, setPreviewTransitioningScreenId] = React.useState<
    string | undefined
  >();

  React.useEffect(() => {
    if (previewTransitioningScreenId) {
      // State was updated after the preview transition
      if (state.routes.some((route) => route.key === previewTransitioningScreenId)) {
        // No longer need to track the preview transitioning screen
        setPreviewTransitioningScreenId(undefined);
      }
    }
  }, [state, previewTransitioningScreenId]);

  const navigationWrapper = React.useMemo(() => {
    if (openPreviewKey) {
      const emit: (typeof navigation)['emit'] = (...args) => {
        const { target, type, data } = args[0];
        if (target === openPreviewKey && data && 'closing' in data && !data.closing) {
          // onWillAppear
          if (type === 'transitionStart') {
            // The screen from preview will appear, so we need to start tracking it
            setPreviewTransitioningScreenId(openPreviewKey);
          }
          // onAppear
          else if (type === 'transitionEnd') {
            // The screen from preview appeared.
            // We can now restore the stack animation
            setOpenPreviewKey(undefined);
          }
        }
        return navigation.emit(...args);
      };
      return {
        ...navigation,
        emit,
      };
    }
    return navigation;
  }, [navigation, openPreviewKey, setOpenPreviewKey]);

  const { computedState, computedDescriptors } = React.useMemo(() => {
    // The preview screen was pushed on the native side, but react-navigation state was not updated yet
    if (previewTransitioningScreenId) {
      const preloadedRoute = state.preloadedRoutes.find(
        (route) => route.key === previewTransitioningScreenId
      );
      if (preloadedRoute) {
        const newState = {
          ...state,
          // On native side the screen is already pushed, so we need to update the state
          preloadedRoutes: state.preloadedRoutes.filter(
            (route) => route.key !== previewTransitioningScreenId
          ),
          routes: [...state.routes, preloadedRoute],
          index: state.index + 1,
        };

        const newDescriptors =
          previewTransitioningScreenId in descriptors
            ? descriptors
            : {
                ...descriptors,
                // We need to add the descriptor. For react-navigation this is still preloaded screen
                // Replicating the logic from https://github.com/react-navigation/react-navigation/blob/eaf1100ac7d99cb93ba11a999549dd0752809a78/packages/native-stack/src/views/NativeStackView.native.tsx#L489
                [previewTransitioningScreenId]: describe(preloadedRoute, true),
              };

        return {
          computedState: newState,
          computedDescriptors: newDescriptors,
        };
      }
    }

    return {
      computedState: state,
      computedDescriptors: descriptors,
    };
  }, [state, previewTransitioningScreenId, describe, descriptors]);

  return { computedState, computedDescriptors, navigationWrapper };
}
