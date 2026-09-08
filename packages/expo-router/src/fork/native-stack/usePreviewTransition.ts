import * as React from 'react';

import { useLinkPreviewContext } from '../../link/preview/LinkPreviewContext';
import type {
  NativeStackViewEmit,
  NativeStackViewState,
} from '../../react-navigation/native-stack';

/**
 * Manages the preview transition state for link previews.
 *
 * Tracks when a preloaded screen is transitioning on the native side (after
 * the preview is committed) but before React Navigation state is updated.
 * During this window, the hook synthesizes state to keep native and JS state
 * in sync.
 */
export function usePreviewTransition(
  state: NativeStackViewState,
  originalEmit: NativeStackViewEmit
) {
  const { openPreviewKeyRef, setOpenPreviewKey } = useLinkPreviewContext();

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

  const emit = React.useCallback<NativeStackViewEmit>(
    (event) => {
      const { target, type, data } = event;
      const key = openPreviewKeyRef.current;
      if (key !== undefined && target === key && data && 'closing' in data && !data.closing) {
        if (type === 'transitionStart') {
          setPreviewTransitioningScreenId(key);
        } else if (type === 'transitionEnd') {
          setOpenPreviewKey(undefined);
        }
      }
      return originalEmit(event);
    },
    [openPreviewKeyRef, originalEmit, setOpenPreviewKey]
  );

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

  return { computedState, emit };
}
