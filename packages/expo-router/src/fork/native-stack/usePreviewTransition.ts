import * as React from 'react';

import { useLinkPreviewContext } from '../../link/preview/LinkPreviewContext';
import type { NativeStackViewState } from '../../react-navigation/native-stack';
import type { NativeStackDescriptorMap } from './descriptors-context';

/**
 * Manages the preview transition state for link previews.
 *
 * Tracks when a preloaded screen is transitioning on the native side (after
 * the preview is committed) but before React Navigation state is updated.
 * During this window, the hook synthesizes state to keep native and JS state
 * in sync.
 */
export function usePreviewTransition<TNavigation extends { emit: (...args: any[]) => any }>(
  state: NativeStackViewState,
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
      // State was updated after the preview transition
      const position = state.routes.findIndex(
        (route) => route.key === previewTransitioningScreenId
      );
      if (position >= 0 && position <= state.index) {
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

  const computedState: NativeStackViewState = React.useMemo(() => {
    // The preview screen was pushed on the native side, but react-navigation state was not updated yet
    if (previewTransitioningScreenId) {
      const position = state.routes.findIndex(
        (route) => route.key === previewTransitioningScreenId
      );
      // Only a preloaded route (positioned after the focused one) can be promoted
      if (position > state.index) {
        const previewRoute = state.routes[position]!;
        if (position === state.index + 1) {
          // The preloaded route is already next to the focused one, so only the focus moves.
          // This is the common case: the PRELOAD action puts the newest preloaded route first.
          return {
            ...state,
            index: state.index + 1,
          };
        }
        // On the native side the screen is already pushed, so move it right after the focused route
        const routes = state.routes.filter((route) => route.key !== previewTransitioningScreenId);
        routes.splice(state.index + 1, 0, previewRoute);
        return {
          ...state,
          routes,
          index: state.index + 1,
        };
      }
    }

    return state;
  }, [state, previewTransitioningScreenId]);

  return { computedState, computedDescriptors: descriptors, navigationWrapper };
}
