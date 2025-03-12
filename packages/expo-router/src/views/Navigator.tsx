// Copyright © 2024 650 Industries.
'use client';

import { RouterFactory, StackRouter, useNavigationBuilder } from '@react-navigation/native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Screen } from './Screen';
import { useContextKey } from '../Route';
import { useGroupNavigatorChildren } from '../layouts/useGroupNavigatorChildren';

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
  children: userDefinedChildren,
  router,
  routerOptions,
}: NavigatorProps<T>) {
  const contextKey = useContextKey();

  // A custom navigator can have a mix of Screen and other components (like a Slot inside a View)
  const { screens, children: nonScreenChildren } = useGroupNavigatorChildren(userDefinedChildren, {
    isCustomNavigator: true,
    contextKey,
  });

  router ||= StackRouter as unknown as T;

  const navigation = useNavigationBuilder(router, {
    // Used for getting the parent with navigation.getParent('/normalized/path')
    ...routerOptions,
    id: contextKey,
    children: screens || [<Screen key="default" />],
    screenOptions,
    initialRouteName,
  });

  // useNavigationBuilder requires at least one screen to be defined otherwise it will throw.
  if (!screens.length) {
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
      {nonScreenChildren}
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

const EMPTY_ARRAY: never[] = [];

function SlotNavigator(props: NavigatorProps<any>) {
  const contextKey = useContextKey();

  debugger;

  // Allows adding Screen components as children to configure routes.
  // This needs to be a stable reference to avoid re-renders.
  const { screens: children } = useGroupNavigatorChildren(EMPTY_ARRAY, {
    contextKey,
  });

  const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, {
    ...props,
    id: contextKey,
    children,
  });

  return (
    <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
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
  const context = React.useContext(NavigatorContext);

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

  return descriptors[state.routes[state.index].key]?.render() ?? null;
}

/**
 * The default navigator for the app when no root _layout is provided.
 */
export function DefaultNavigator() {
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
