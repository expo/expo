import { ComponentProps, ReactElement, useState, useContext } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { ScreenContainer, Screen } from 'react-native-screens';

import { TabContext, TabsDescriptor, TabsDescriptorsContext, TabsStateContext } from './TabContext';
import { TabListProps } from './TabList';
import { useNavigation } from '../useNavigation';

export type UseTabSlotOptions = ComponentProps<typeof ScreenContainer> & {
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
  style,
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
    <ScreenContainer
      enabled={detachInactiveScreens}
      hasTwoStates
      style={style || styles.flexBoxGrowOnly}>
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];

        return (
          <TabContext.Provider key={descriptor.route.key} value={descriptor.options}>
            {renderFn(descriptor, {
              index,
              isFocused: state.index === index,
              loaded: loaded[route.key],
              detachInactiveScreens,
            })}
          </TabContext.Provider>
        );
      })}
    </ScreenContainer>
  );
}

export type TabSlotProps = UseTabSlotOptions;

export function TabSlot(props: TabSlotProps) {
  return useTabSlot(props);
}

export function useTab() {
  const navigation = useNavigation();
  const options = useContext(TabContext);

  return {
    options,
    setOptions: navigation.setOptions,
  };
}

export function defaultTabsSlotRender(
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
    <Screen
      key={descriptor.route.key}
      enabled={detachInactiveScreens}
      activityState={isFocused ? 2 : 0}
      freezeOnBlur={freezeOnBlur}
      style={styles.flexBoxGrowOnly}>
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
