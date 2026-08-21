// Copyright © 2024 650 Industries.
'use client';

import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getValidInitialRouteName,
  ScreenErrorBoundaryContext,
  useContextKey,
  useRouteNode,
} from '../Route';
import { GuardContextProvider } from '../layouts/GuardContext';
import { StackRouter } from '../layouts/StackClient';
import { useFilterScreenChildren } from '../layouts/withLayoutContext';
import type { RouterFactory } from '../react-navigation/native';
import { useNavigationBuilder } from '../react-navigation/native';
import { useSortedScreens } from '../useScreens';
import { Screen } from './Screen';
import type { ErrorBoundaryProps } from './Try';

export type NavigatorContextValue = ReturnType<typeof useNavigationBuilder> & {
  contextKey: string;
  router: RouterFactory<any, any, any>;
};

export const NavigatorContext = React.createContext<NavigatorContextValue | null>(null);

if (process.env.NODE_ENV !== 'production') {
  NavigatorContext.displayName = 'NavigatorContext';
}

type UseNavigationBuilderRouter = Parameters<typeof useNavigationBuilder>[0];
type UseNavigationBuilderOptions = Parameters<typeof useNavigationBuilder>[1];

export type NavigatorProps<T extends UseNavigationBuilderRouter> = {
  screenOptions?: UseNavigationBuilderOptions['screenOptions'];
  children?: UseNavigationBuilderOptions['children'];
  router?: T;
  routerOptions?: Omit<Parameters<T>[0], 'initialRouteName'>;
  /** A component to render when an individual screen in this navigator throws an error. */
  unstable_screenErrorBoundary?: React.ComponentType<ErrorBoundaryProps>;
};

// TODO(@ubax): Update docs/pages/router/migrate/from-react-navigation.mdx:387 for the removed prop.

/**
 * An unstyled custom navigator. Good for basic web layouts.
 *
 * @hidden
 */
export function Navigator<T extends UseNavigationBuilderRouter = typeof StackRouter>({
  screenOptions,
  children,
  router,
  routerOptions,
  unstable_screenErrorBoundary,
}: NavigatorProps<T>) {
  const contextKey = useContextKey();
  const node = useRouteNode();

  // A custom navigator can have a mix of Screen and other components (like a Slot inside a View)
  const {
    screens,
    children: nonScreenChildren,
    guardedRedirects,
  } = useFilterScreenChildren(children, {
    isCustomNavigator: true,
    contextKey,
  });

  const sortedScreens = useSortedScreens(
    screens ?? [],
    guardedRedirects,
    unstable_screenErrorBoundary
  );

  router ||= StackRouter as unknown as T;

  const navigation = useNavigationBuilder(router, {
    // Used for getting the parent with navigation.getParent('/normalized/path')
    ...routerOptions,
    id: contextKey,
    children: sortedScreens || [<Screen key="default" />],
    screenOptions,
    initialRouteName: getValidInitialRouteName(node),
  });

  // useNavigationBuilder requires at least one screen to be defined otherwise it will throw.
  if (!sortedScreens.length) {
    console.warn(`Navigator at "${contextKey}" has no children.`);
    return null;
  }

  const content = (
    <GuardContextProvider node={node} guardedRedirects={guardedRedirects}>
      {nonScreenChildren}
    </GuardContextProvider>
  );

  return (
    <NavigatorContext.Provider
      value={{
        ...navigation,
        contextKey,
        router,
      }}>
      {unstable_screenErrorBoundary ? (
        <ScreenErrorBoundaryContext value={unstable_screenErrorBoundary}>
          {content}
        </ScreenErrorBoundaryContext>
      ) : (
        content
      )}
    </NavigatorContext.Provider>
  );
}

/**
 * @hidden
 */
export function useNavigatorContext() {
  const context = React.use(NavigatorContext);
  if (!context) {
    throw new Error('useNavigatorContext must be used within a <Navigator />');
  }
  return context;
}

function SlotNavigator({ unstable_screenErrorBoundary, ...props }: NavigatorProps<any>) {
  const contextKey = useContextKey();
  const node = useRouteNode();

  // Allows adding Screen components as children to configure routes.
  const { screens, guardedRedirects } = useFilterScreenChildren([], {
    contextKey,
  });

  const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, {
    ...props,
    id: contextKey,
    children: useSortedScreens(screens ?? [], guardedRedirects, unstable_screenErrorBoundary),
    initialRouteName: getValidInitialRouteName(node),
  });
  const focusedRouteKey = state.routes[state.index]?.key;

  const content = (
    <GuardContextProvider node={node} guardedRedirects={guardedRedirects}>
      <NavigationContent>
        {focusedRouteKey ? descriptors[focusedRouteKey]!.render() : null}
      </NavigationContent>
    </GuardContextProvider>
  );

  return unstable_screenErrorBoundary ? (
    <ScreenErrorBoundaryContext value={unstable_screenErrorBoundary}>
      {content}
    </ScreenErrorBoundaryContext>
  ) : (
    content
  );
}

/**
 * Renders the currently selected content.
 *
 * There are actually two different implementations of `<Slot/>`:
 *  - Used inside a `_layout` as the `Navigator`
 *  - Used inside a `Navigator` as the content
 *
 * Since a custom `Navigator` will set the `NavigatorContext.contextKey` to
 * the current `_layout`, you can use this to determine if you are inside
 * a custom navigator or not.
 */
export function Slot(props: Omit<NavigatorProps<any>, 'children'>) {
  const contextKey = useContextKey();
  const context = React.use(NavigatorContext);

  if (context?.contextKey !== contextKey) {
    // The _layout has changed since the last navigator
    return <SlotNavigator {...props} />;
  }

  /*
   * The user has defined a custom navigator
   * <Navigator><Slot /></Navigator>
   */
  return <NavigatorSlot />;
}

/**
 * Render the current navigator content.
 */
function NavigatorSlot() {
  const context = useNavigatorContext();

  const { state, descriptors } = context;
  const focusedRouteKey = state.routes[state.index]?.key;

  return focusedRouteKey ? (descriptors[focusedRouteKey]?.render() ?? null) : null;
}

/**
 * The default navigator for the app when no root _layout is provided.
 */
export function DefaultNavigator() {
  if (process.env.EXPO_OS === 'android') {
    return <SlotNavigator />;
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SlotNavigator />
    </SafeAreaView>
  );
}

Navigator.Slot = NavigatorSlot;
Navigator.useContext = useNavigatorContext;

/** Used to configure route settings. */
Navigator.Screen = Screen;
