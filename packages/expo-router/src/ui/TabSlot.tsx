import { ComponentProps, ReactElement, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { ScreenContainer, Screen } from 'react-native-screens';

import { TabContext, TabsDescriptor } from './TabContext';
import { TabListProps } from './TabList';
import { useNavigatorContext } from '../views/Navigator';

export type UseTabSlotOptions = ComponentProps<typeof ScreenContainer> & {
  /** Remove inactive screens */
  detachInactiveScreens?: boolean;
  /** Override how the <Screen /> is rendered */
  renderFn?: typeof defaultTabsSlotRender;
};

/**
 * Options provided to the UseTabSlotOptions.renderFn
 */
export type TabsSlotRenderOptions = {
  /** Index of screen */
  index: number;
  /** Whether the screen is focused */
  isFocused: boolean;
  /** Whether the screen has been loaded */
  loaded: boolean;
  /** Should the screen be unloaded when inactive */
  detachInactiveScreens: boolean;
};

/**
 * Returns a ReactElement of the current tab.
 *
 * @see `useTabSlot`
 *
 * @example
 * ```ts
 * function MyTabSlot() {
 *   const slot = useTabSlot()
 *   return slot
 * }
 * ```
 */
export function useTabSlot(options: UseTabSlotOptions = {}) {
  const {
    detachInactiveScreens = Platform.OS === 'web' ||
      Platform.OS === 'android' ||
      Platform.OS === 'ios',
    style,
    renderFn = defaultTabsSlotRender,
  } = options;

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

/**
 * Renders the current tab.
 *
 * @see `useTabSlot`
 *
 * @example
 * ```ts
 * <Tabs>
 *  <TabSlot />
 *  <TabList>
 *   <TabTrigger name="home" href="/" />
 *  </TabList>
 * </Tabs>
 * ```
 */
export function TabSlot(props: TabSlotProps) {
  return useTabSlot(props);
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

/**
 * @hidden
 */
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
