// Copyright © 2024 650 Industries.
'use client';

import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useContextKey, useRouteNode } from '../Route';
import { GuardContextProvider } from '../layouts/GuardContext';
import { StackRouter } from '../layouts/StackClient';
import { useFilterScreenChildren } from '../layouts/withLayoutContext';
import type { RouterFactory } from '../react-navigation/native';
import { useNavigationBuilder } from '../react-navigation/native';
import { useSortedScreens } from '../useScreens';
import { Screen } from './Screen';

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
  initialRouteName?: UseNavigationBuilderOptions['initialRouteName'];
  screenOptions?: UseNavigationBuilderOptions['screenOptions'];
  children?: UseNavigationBuilderOptions['children'];
  router?: T;
  routerOptions?: Omit<Parameters<T>[0], 'initialRouteName'>;
};

/**
 * An unstyled custom navigator. Good for basic web layouts.
 *
 * @hidden
 */
export function Navigator<T extends UseNavigationBuilderRouter = typeof StackRouter>({
  initialRouteName,
  screenOptions,
  children,
  router,
  routerOptions,
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

  const sortedScreens = useSortedScreens(screens ?? [], guardedRedirects);

  router ||= StackRouter as unknown as T;

  const navigation = useNavigationBuilder(router, {
    // Used for getting the parent with navigation.getParent('/normalized/path')
    ...routerOptions,
    id: contextKey,
    children: sortedScreens || [<Screen key="default" />],
    screenOptions,
    initialRouteName,
  });

  // useNavigationBuilder requires at least one screen to be defined otherwise it will throw.
  if (!sortedScreens.length) {
    console.warn(`Navigator at "${contextKey}" has no children.`);
    return null;
  }

  return (
    <NavigatorContext.Provider
      value={{
        ...navigation,
        contextKey,
        router,
      }}>
      <GuardContextProvider node={node} guardedRedirects={guardedRedirects}>
        {nonScreenChildren}
      </GuardContextProvider>
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

function SlotNavigator(props: NavigatorProps<any>) {
  const contextKey = useContextKey();
  const node = useRouteNode();

  // Allows adding Screen components as children to configure routes.
  const { screens, guardedRedirects } = useFilterScreenChildren([], {
    contextKey,
  });

  const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, {
    ...props,
    id: contextKey,
    children: useSortedScreens(screens ?? [], guardedRedirects),
  });

  return (
    <GuardContextProvider node={node} guardedRedirects={guardedRedirects}>
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    </GuardContextProvider>
  );
}

/**
 * Renders the child routes of the current layout without any navigation UI or animation.
 * Use it in a `_layout` file when you want the layout to render its child route directly,
 * for example to add a shared header or wrapper around every screen in a directory.
 *
 * A `Slot` behaves differently depending on where it is used. Inside a `_layout` it acts as
 * the navigator itself. Inside a custom `Navigator` it renders that navigator's content.
 *
 * @example
 * ```tsx app/_layout.tsx
 * import { Slot } from 'expo-router';
 *
 * export default function Layout() {
 *   return <Slot />;
 * }
 * ```
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

  return descriptors[state.routes[state.index]!.key]?.render() ?? null;
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
