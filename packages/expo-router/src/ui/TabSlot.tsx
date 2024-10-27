import { ComponentProps, ReactElement, useState, useContext } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { ScreenContainer, Screen } from 'react-native-screens';

import { TabContext, TabsDescriptor } from './TabContext';
import { TabListProps } from './TabList';
import { useNavigation } from '../useNavigation';
import { useNavigatorContext } from '../views/Navigator';

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
  const { state, descriptors } = useNavigatorContext();
  const focusedRouteKey = state.routes[state.index].key;
  const [loaded, setLoaded] = useState({ [focusedRouteKey]: true });

  if (!loaded[focusedRouteKey]) {
    setLoaded({ ...loaded, [focusedRouteKey]: true });
  }

  return (
    <ScreenContainer
      enabled={detachInactiveScreens}
      hasTwoStates
      style={[styles.screenContainer, style]}>
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key] as unknown as TabsDescriptor;

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
      style={[styles.screen, isFocused ? styles.focused : styles.unfocused]}>
      {descriptor.render()}
    </Screen>
  );
}

export function isTabSlot(child: ReactElement<any>): child is ReactElement<TabListProps> {
  return child.type === TabSlot;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  screenContainer: {
    flexShrink: 0,
    flexGrow: 1,
  },
  focused: {
    zIndex: 1,
    display: 'flex',
    flexShrink: 0,
    flexGrow: 1,
  },
  unfocused: {
    zIndex: -1,
    display: 'none',
    flexShrink: 1,
    flexGrow: 0,
  },
});
