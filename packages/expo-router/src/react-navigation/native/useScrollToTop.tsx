'use client';
import * as React from 'react';
import { use } from 'react';
import type { ScrollView } from 'react-native';

import { type EventArg, NavigationContext, useRoute } from '../core';
import { NavigatorStateContext } from '../core/useNavigationState';

type ScrollOptions = { x?: number; y?: number; animated?: boolean };

type ScrollableView =
  | { scrollToTop(): void }
  | { scrollTo(options: ScrollOptions): void }
  | { scrollToOffset(options: { offset: number; animated?: boolean }): void }
  | { scrollResponderScrollTo(options: ScrollOptions): void };

type ScrollableWrapper =
  | { getScrollResponder(): React.ReactNode | ScrollView }
  | { getNode(): ScrollableView }
  | ScrollableView
  | null;

function getScrollableNode(ref: React.RefObject<ScrollableWrapper>) {
  if (ref.current == null) {
    return null;
  }

  if (
    'scrollToTop' in ref.current ||
    'scrollTo' in ref.current ||
    'scrollToOffset' in ref.current ||
    'scrollResponderScrollTo' in ref.current
  ) {
    // This is already a scrollable node.
    return ref.current;
  } else if ('getScrollResponder' in ref.current) {
    // If the view is a wrapper like FlatList, SectionList etc.
    // We need to use `getScrollResponder` to get access to the scroll responder
    return ref.current.getScrollResponder();
  } else if ('getNode' in ref.current) {
    // When a `ScrollView` is wrapped in `Animated.createAnimatedComponent`
    // we need to use `getNode` to get the ref to the actual scrollview.
    // Note that `getNode` is deprecated in newer versions of react-native
    // this is why we check if we already have a scrollable node above.
    return ref.current.getNode();
  } else {
    return ref.current;
  }
}

export function useScrollToTop(ref: React.RefObject<ScrollableWrapper>) {
  const navigation = use(NavigationContext);
  const navigatorState = use(NavigatorStateContext);
  const route = useRoute();
  const isDirectlyInTabNavigator = navigatorState?.type === 'tab';
  const firstRouteKey = navigatorState?.routes[0]?.key;

  if (navigation === undefined) {
    throw new Error(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?"
    );
  }

  React.useEffect(() => {
    const handler = (e: EventArg<'tabPress', true>) => {
      // We should scroll to top only when the screen is focused
      const isFocused = navigation.isFocused();

      // In a nested stack navigator, tab press resets the stack to first screen
      // So we should scroll to top only when we are on first screen
      const isFirst = isDirectlyInTabNavigator || firstRouteKey === route.key;

      // Run the operation in the next frame so we're sure all listeners have been run
      // This is necessary to know if preventDefault() has been called
      requestAnimationFrame(() => {
        const scrollable = getScrollableNode(ref) as ScrollableWrapper;

        if (isFocused && isFirst && scrollable && !e.defaultPrevented) {
          if ('scrollToTop' in scrollable) {
            scrollable.scrollToTop();
          } else if ('scrollTo' in scrollable) {
            scrollable.scrollTo({ y: 0, animated: true });
          } else if ('scrollToOffset' in scrollable) {
            scrollable.scrollToOffset({ offset: 0, animated: true });
          } else if ('scrollResponderScrollTo' in scrollable) {
            scrollable.scrollResponderScrollTo({ y: 0, animated: true });
          }
        }
      });
    };

    const unsubscribers: (() => void)[] = [];
    let currentNavigation: typeof navigation | undefined = navigation;
    while (currentNavigation) {
      // Non-tab navigators never emit `tabPress`, so these listeners are inert.
      // @ts-expect-error: `tabPress` is emitted only by tab navigators.
      unsubscribers.push(currentNavigation.addListener('tabPress', handler));
      currentNavigation = currentNavigation.getParent();
    }

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [firstRouteKey, isDirectlyInTabNavigator, navigation, ref, route.key]);
}
