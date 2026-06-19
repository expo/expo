import * as React from 'react';

import type { NativeStackDescriptorMap } from './descriptors-context';
import { useLinkPreviewContext } from '../../link/preview/LinkPreviewContext';
import type { ParamListBase, StackNavigationState } from '../../react-navigation/native';

/**
 * Manages the preview transition state for link previews.
 *
 * Tracks when a preloaded screen is transitioning on the native side (after
 * the preview is committed) but before React Navigation state is updated.
 * Keeps native and JS state in sync.
 */
export function usePreviewTransition<TNavigation extends { emit: (...args: any[]) => any }>(
  state: StackNavigationState<ParamListBase>,
  navigation: TNavigation,
  descriptors: NativeStackDescriptorMap
) {
  const { openPreviewKey, setOpenPreviewKey } = useLinkPreviewContext();

  // Track the preview screen currently transitioning on the native side
  const [previewTransitioningScreenId, setPreviewTransitioningScreenId] = React.useState<
    string | undefined
  >();

  React.useEffect(() => {
    if (previewTransitioningScreenId) {
      const position = state.routes.findIndex(
        (route) => route.key === previewTransitioningScreenId
      );
      // State was updated after the preview transition
      if (position !== -1 && position <= state.index) {
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
      const position = state.routes.findIndex(
        (route) => route.key === previewTransitioningScreenId
      );
      if (position > state.index) {
        const previewedRoute = state.routes[position]!;
        const activeRoutes = state.routes.slice(0, state.index + 1);
        const otherInactiveRoutes = state.routes
          .slice(state.index + 1)
          .filter((route) => route.key !== previewTransitioningScreenId);

        return {
          computedState: {
            ...state,
            index: state.index + 1,
            routes: [...activeRoutes, previewedRoute, ...otherInactiveRoutes],
          },
          // TODO(@ubax): Remove the computedDescriptors as it is no longer needed
          computedDescriptors: descriptors,
        };
      }
    }

    return {
      computedState: state,
      computedDescriptors: descriptors,
    };
  }, [state, previewTransitioningScreenId, descriptors]);

  return { computedState, computedDescriptors, navigationWrapper };
}
