import { Slot } from '@radix-ui/react-slot';
import { ReactElement, ComponentType, useState, useContext } from 'react';
import { View, Platform, ViewProps, StyleSheet } from 'react-native';
import { ScreenContainer, Screen } from 'react-native-screens';

import { TabsDescriptor, TabsDescriptorsContext, TabsStateContext } from './TabContext';
import { TabListProps } from './TabList';

export type UseTabSlotOptions = {
  detachInactiveScreens?: boolean;
  renderFn?: typeof defaultTabsSlotRender;
};

export type TabsSlotRenderOptions = {
  index: number;
  isFocused: boolean;
  loaded: boolean;
};

export function useTabSlot({
  detachInactiveScreens = Platform.OS === 'web' ||
    Platform.OS === 'android' ||
    Platform.OS === 'ios',
  renderFn = defaultTabsSlotRender,
}: UseTabSlotOptions = {}) {
  const state = useContext(TabsStateContext);
  const descriptors = useContext(TabsDescriptorsContext);
  const focusedRouteKey = state.routes[state.index].key;
  const [loaded, setLoaded] = useState({ [focusedRouteKey]: true });

  if (!loaded[focusedRouteKey]) {
    setLoaded({ ...loaded, [focusedRouteKey]: true });
  }

  return (
    <ScreenContainer enabled={detachInactiveScreens} hasTwoStates>
      {state.routes.map((route, index) => {
        return renderFn(descriptors[route.key], {
          index,
          isFocused: state.index === index,
          loaded: loaded[route.key],
        });
      })}
    </ScreenContainer>
  );
}

export type TabSlotProps = ViewProps & {
  asChild?: boolean;
  options?: UseTabSlotOptions;
};

export function TabSlot({ options, asChild, ...props }: TabSlotProps) {
  const Element: ComponentType<any> = asChild ? Slot : View;
  return (
    <Element style={styles.flexBoxGrowOnly} {...props}>
      {useTabSlot(options)}
    </Element>
  );
}

export function defaultTabsSlotRender(
  descriptor: TabsDescriptor,
  { isFocused, loaded }: TabsSlotRenderOptions
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
    <Screen
      key={descriptor.route.key}
      activityState={isFocused ? 2 : 0}
      enabled={isFocused}
      freezeOnBlur={freezeOnBlur}>
      <View style={[styles.flexBoxGrowOnly, isFocused ? styles.focused : styles.unfocused]}>
        {descriptor.render()}
      </View>
    </Screen>
  );
}

export function isTabSlot(child: ReactElement<any>): child is ReactElement<TabListProps> {
  return child.type === TabSlot;
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
    display: 'none',
  },
});
