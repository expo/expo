// Copyright © 2024 650 Industries.
'use client';

import { RouterFactory, StackRouter, useNavigationBuilder } from '@react-navigation/native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Screen } from './Screen';
import { useContextKey } from '../Route';
import { useFilterScreenChildren } from '../layouts/withLayoutContext';
import { useSortedScreens } from '../useScreens';

type NavigatorTypes = ReturnType<typeof useNavigationBuilder>;

// TODO: This might already exist upstream, maybe something like `useCurrentRender` ?
export const NavigatorContext = React.createContext<{
  contextKey: string;
  state: NavigatorTypes['state'];
  navigation: NavigatorTypes['navigation'];
  descriptors: NavigatorTypes['descriptors'];
  router: RouterFactory<any, any, any>;
} | null>(null);

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
export function Navigator<T extends UseNavigationBuilderRouter>({
  initialRouteName,
  screenOptions,
  children,
  router,
  routerOptions,
}: NavigatorProps<T>) {
  const contextKey = useContextKey();

  // Allows adding Screen components as children to configure routes.
  const { screens, children: otherSlot } = useFilterScreenChildren(children, {
    isCustomNavigator: true,
    contextKey,
  });

  const sorted = useSortedScreens(screens ?? []);

  if (!sorted.length) {
    console.warn(`Navigator at "${contextKey}" has no children.`);
    return null;
  }

  return (
    <QualifiedNavigator
      initialRouteName={initialRouteName}
      screenOptions={screenOptions}
      screens={sorted}
      contextKey={contextKey}
      router={router}
      routerOptions={routerOptions}>
      {otherSlot}
    </QualifiedNavigator>
  );
}

function QualifiedNavigator<T extends UseNavigationBuilderRouter>({
  initialRouteName,
  screenOptions,
  children,
  screens,
  contextKey,
  router = StackRouter as T,
  routerOptions,
}: NavigatorProps<T> & { contextKey: string; screens: React.ReactNode[] }) {
  const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(router, {
    // Used for getting the parent with navigation.getParent('/normalized/path')
    ...routerOptions,
    id: contextKey,
    children: screens,
    screenOptions,
    initialRouteName,
  });

  return (
    <NavigatorContext.Provider
      value={{
        contextKey,
        state,
        navigation,
        descriptors,
        router,
      }}>
      <NavigationContent>{children}</NavigationContent>
    </NavigatorContext.Provider>
  );
}

/**
 * @hidden
 */
export function useNavigatorContext() {
  const context = React.useContext(NavigatorContext);
  if (!context) {
    throw new Error('useNavigatorContext must be used within a <Navigator />');
  }
  return context;
}

export function useSlot() {
  const context = useNavigatorContext();

  const { state, descriptors } = context;

  const current = state.routes.find((route, i) => {
    return state.index === i;
  });

  if (!current) {
    return null;
  }

  return descriptors[current.key]?.render() ?? null;
}

/** Renders the currently selected content. */
export function Slot(props: Omit<NavigatorProps<any>, 'children'>) {
  const contextKey = useContextKey();
  const context = React.useContext(NavigatorContext);
  // Ensure the context is for the current contextKey
  if (context?.contextKey !== contextKey) {
    // Qualify the content and re-export.
    return (
      <Navigator {...props}>
        <QualifiedSlot />
      </Navigator>
    );
  }

  return <QualifiedSlot />;
}

export function QualifiedSlot() {
  return useSlot();
}

export function DefaultNavigator() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Navigator>
        <QualifiedSlot />
      </Navigator>
    </SafeAreaView>
  );
}

Navigator.Slot = Slot;
Navigator.useContext = useNavigatorContext;

/** Used to configure route settings. */
Navigator.Screen = Screen;
