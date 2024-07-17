import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { NavigationContext, NavigationRouteContext } from '@react-navigation/native';
import { ScreenContainer, Screen } from 'react-native-screens';
import { Route, TabsDescriptor, useTabsContext } from './Tabs.common';

export type UseTabsSlotOptions = {
  detachInactiveScreens?: boolean;
  renderFn?: typeof defaultTabsSlotRender;
};

export type TabsSlotRenderOptions = {
  index: number;
  isFocused: boolean;
  loaded: boolean;
  detachInactiveScreens: boolean;
};

export function useTabSlot({
  detachInactiveScreens = Platform.OS === 'web' ||
    Platform.OS === 'android' ||
    Platform.OS === 'ios',
  renderFn = defaultTabsSlotRender,
}: UseTabsSlotOptions = {}) {
  const { state, descriptors } = useTabsContext();
  const focusedRouteKey = state.routes[state.index].key;
  const [loaded, setLoaded] = useState({ [focusedRouteKey]: true });

  if (!loaded[focusedRouteKey]) {
    setLoaded({ ...loaded, [focusedRouteKey]: true });
  }

  return state.routes.map((route, index) => {
    return renderFn(route, descriptors[route.key], {
      index,
      isFocused: state.index === index,
      loaded: loaded[route.key],
      detachInactiveScreens,
    });
  });
}

export function TabSlot() {
  return useTabSlot();
}

export function defaultTabsSlotRender(
  route: Route,
  descriptor: TabsDescriptor,
  { isFocused, loaded, detachInactiveScreens }: TabsSlotRenderOptions
) {
  const { lazy = true, unmountOnBlur, freezeOnBlur } = descriptor.options;

  if (unmountOnBlur && !isFocused) {
    return null;
  }

  if (lazy && !loaded && !isFocused) {
    // Don't render a lazy screen if we've never navigated to it
    return null;
  }

  return (
    <NavigationContext.Provider value={descriptor.navigation}>
      <NavigationRouteContext.Provider value={route}>
        <ScreenContainer
          enabled={detachInactiveScreens}
          hasTwoStates
          key={route.key}
          style={[StyleSheet.absoluteFill, { zIndex: isFocused ? 0 : -1 }]}>
          <Screen
            enabled={detachInactiveScreens}
            activityState={isFocused ? 2 : 0}
            freezeOnBlur={freezeOnBlur}>
            {descriptor.render()}
          </Screen>
        </ScreenContainer>
      </NavigationRouteContext.Provider>
    </NavigationContext.Provider>
  );
}
