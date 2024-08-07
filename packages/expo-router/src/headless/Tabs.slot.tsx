import { useState } from 'react';
import { View, Platform, ViewProps, StyleSheet } from 'react-native';
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

  return (
    <>
      {state.routes.map((route, index) => {
        return renderFn(route, descriptors[route.key], {
          index,
          isFocused: state.index === index,
          loaded: loaded[route.key],
          detachInactiveScreens,
        });
      })}
    </>
  );
}

export function TabSlot(props: ViewProps) {
  return (
    <View
      style={{
        flexGrow: 1,
        flexShrink: 0,
      }}
      {...props}>
      {useTabSlot()}
    </View>
  );
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
    <ScreenContainer
      key={route.key}
      enabled={detachInactiveScreens}
      hasTwoStates
      style={isFocused ? styles.focused : styles.unfocused}>
      <NavigationContext.Provider value={descriptor.navigation}>
        <NavigationRouteContext.Provider value={route}>
          <Screen
            enabled={detachInactiveScreens}
            activityState={isFocused ? 2 : 0}
            freezeOnBlur={freezeOnBlur}
            style={styles.flexBoxGrowOnly}>
            <View style={styles.flexBoxGrowOnly}>{descriptor.render()}</View>
          </Screen>
        </NavigationRouteContext.Provider>
      </NavigationContext.Provider>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flexBoxGrowOnly: {
    flexShrink: 0,
    flexGrow: 1,
    position: 'relative',
  },
  focused: {
    zIndex: 0,
    flexGrow: 1,
    flexShrink: 0,
  },
  unfocused: {
    zIndex: -1,
  },
});
