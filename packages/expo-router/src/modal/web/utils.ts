'use client';
import { ParamListBase, StackNavigationState } from '@react-navigation/native';
import React from 'react';

import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';

/**
 * A minimal subset of `ExtendedStackNavigationOptions` needed for the helper
 * @internal
 */
export type PresentationOptions = Partial<Pick<ExtendedStackNavigationOptions, 'presentation'>>;

/**
 * Helper to determine if a given screen should be treated as a modal-type presentation
 *
 * @param options - The navigation options.
 * @returns Whether the screen should be treated as a modal-type presentation.
 *
 * @internal
 */
export function isModalPresentation(options?: PresentationOptions | null) {
  const presentation = options?.presentation;
  return (
    presentation === 'modal' ||
    presentation === 'formSheet' ||
    presentation === 'fullScreenModal' ||
    presentation === 'containedModal' ||
    presentation === 'transparentModal' ||
    presentation === 'containedTransparentModal'
  );
}

/**
 * Helper to determine if a given screen should be treated as a transparent modal-type presentation
 *
 * @param options - The navigation options.
 * @returns Whether the screen should be treated as a transparent modal-type presentation.
 *
 * @internal
 */
export function isTransparentModalPresentation(options?: PresentationOptions | null) {
  const presentation = options?.presentation;
  return presentation === 'transparentModal' || presentation === 'containedTransparentModal';
}

/**
 * SSR-safe viewport detection: initial render always returns `false` so that
 * server and client markup match. The actual media query evaluation happens
 * after mount.
 *
 * @internal
 */
export function useIsDesktop(breakpoint: number = 768) {
  const isWeb = process.env.EXPO_OS === 'web';

  // Ensure server-side and initial client render agree (mobile first).
  const [isDesktop, setIsDesktop] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;

    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

    // Update immediately after mount
    setIsDesktop(mql.matches);

    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [breakpoint, isWeb]);

  return isDesktop;
}

/**
 * Returns a copy of the given Stack navigation state with any modal-type routes removed
 * (only when running on the web) and a recalculated `index` that still points at the
 * currently active non-modal route. If the active route *is* a modal that gets
 * filtered out, we fall back to the last remaining route – this matches the logic
 * used inside `ModalStackView` so that the underlying `NativeStackView` never tries
 * to render a modal screen that is simultaneously being shown in the overlay.
 *
 * This helper is exported primarily for unit-testing; it should be considered
 * internal to `ModalStack.web` and not a public API.
 *
 * @param state - The navigation state.
 * @param descriptors - The navigation descriptors.
 * @param isWeb - Whether the current platform is web.
 * @returns The navigation state with any modal-type routes removed.
 *
 * @internal
 */
export function convertStackStateToNonModalState(
  state: StackNavigationState<ParamListBase>,
  descriptors: Record<string, { options: ExtendedStackNavigationOptions }>,
  isWeb: boolean
) {
  if (!isWeb) {
    return { routes: state.routes, index: state.index };
  }

  // Remove every modal-type route from the stack on web.
  const routes = state.routes.filter((route) => {
    return !isModalPresentation(descriptors[route.key].options);
  });

  // Recalculate the active index so it still points at the same non-modal route, or –
  // if that route was filtered out – at the last remaining route.
  let index = routes.findIndex((r) => r.key === state.routes[state.index]?.key);
  if (index < 0) {
    index = routes.length > 0 ? routes.length - 1 : 0;
  }

  return { routes, index };
}

/**
 * Returns the index of the last route in the stack that is *not* a modal.
 *
 * @param state - The navigation state.
 * @param descriptors - The navigation descriptors.
 * @returns The index of the last non-modal route.
 *
 * @internal
 */
export function findLastNonModalIndex(
  state: StackNavigationState<ParamListBase>,
  descriptors: Record<string, { options: ExtendedStackNavigationOptions }>
) {
  // Iterate backwards through the stack to find the last non-modal route.
  for (let i = state.routes.length - 1; i >= 0; i--) {
    if (!isModalPresentation(descriptors[state.routes[i].key].options)) {
      return i;
    }
  }
  return -1;
}
