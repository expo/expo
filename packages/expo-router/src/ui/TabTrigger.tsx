import { Slot } from '@radix-ui/react-slot';
import { TabNavigationState } from '@react-navigation/native';
import { ReactNode, useContext, ReactElement, ComponentProps, useCallback } from 'react';
import { View, StyleSheet, Pressable, PressableProps } from 'react-native';

import { TabTriggerMapContext } from './TabContext';
import { ExpoTabsResetValue } from './TabRouter';
import type { TriggerMap } from './common';
import { appendBaseUrl } from '../fork/getPathFromState';
import { router } from '../imperative-api';
import { shouldHandleMouseEvent } from '../link/useLinkToPathProps';
import { stripGroupSegmentsFromPath } from '../matchers';
import type { Href } from '../types';
import { useNavigatorContext } from '../views/Navigator';

type PressablePropsWithoutFunctionChildren = Omit<PressableProps, 'children'> & {
  children?: ReactNode | undefined;
};

export type TabTriggerProps = PressablePropsWithoutFunctionChildren & {
  /**
   *  Name of tab. When used within a `TabList` this sets the name of the tab.
   * Otherwise, this references the name.
   */
  name: string;
  /**
   * Name of tab. Required when used within a `TabList`.
   */
  href?: Href;
  /**
   * Forward props to child component. Useful for custom wrappers.
   */
  asChild?: boolean;
  /**
   * Resets the route when switching to a tab.
   */
  reset?: SwitchToOptions['reset'] | 'onLongPress';
};

export type TabTriggerOptions = {
  name: string;
  href: Href;
};

export type TabTriggerSlotProps = PressablePropsWithoutFunctionChildren &
  React.RefAttributes<View> & {
    isFocused?: boolean;
    href?: string;
  };

const TabTriggerSlot = Slot as React.ForwardRefExoticComponent<TabTriggerSlotProps>;

/**
 * Creates a trigger to navigate to a tab. When used as child of `TabList`, its
 * functionality slightly changes since the `href` prop is required,
 * and the trigger also defines what routes are present in the `Tabs`.
 *
 * When used outside of `TabList`, this component no longer requires an `href`.
 *
 * @example
 * ```tsx
 * <Tabs>
 *  <TabSlot />
 *  <TabList>
 *   <TabTrigger name="home" href="/" />
 *  </TabList>
 * </Tabs>
 * ```
 */
export function TabTrigger({ asChild, name, href, reset = 'onFocus', ...props }: TabTriggerProps) {
  const { trigger, triggerProps } = useTabTrigger({
    name,
    reset,
    ...props,
  });

  // Pressable doesn't accept the extra props, so only pass them if we are using asChild
  if (asChild) {
    return (
      <TabTriggerSlot
        style={styles.tabTrigger}
        {...props}
        {...triggerProps}
        href={trigger?.resolvedHref}>
        {props.children}
      </TabTriggerSlot>
    );
  } else {
    // These props are not typed, but are allowed by React Native Web
    const reactNativeWebProps = { href: trigger?.resolvedHref };

    return (
      <Pressable style={styles.tabTrigger} {...reactNativeWebProps} {...props} {...triggerProps}>
        {props.children}
      </Pressable>
    );
  }
}

/**
 * @hidden
 */
export function isTabTrigger(
  child: ReactElement<any>
): child is ReactElement<ComponentProps<typeof TabTrigger>> {
  return child.type === TabTrigger;
}

/**
 * Options for `switchTab` function.
 */
export type SwitchToOptions = {
  /**
   * Navigate and reset the history.
   */
  reset?: ExpoTabsResetValue;
};

export type Trigger = TriggerMap[string] & {
  isFocused: boolean;
  resolvedHref: string;
  route: TabNavigationState<any>['routes'][number];
};

export type UseTabTriggerResult = {
  switchTab: (name: string, options: SwitchToOptions) => void;
  getTrigger: (name: string) => Trigger | undefined;
  trigger?: Trigger;
  triggerProps: TriggerProps;
};

export type TriggerProps = {
  isFocused: boolean;
  onPress: PressableProps['onPress'];
  onLongPress: PressableProps['onLongPress'];
};

/**
 * Utility hook creating custom `TabTrigger`.
 */
export function useTabTrigger(options: TabTriggerProps): UseTabTriggerResult {
  const { state, navigation } = useNavigatorContext();
  const { name, reset, onPress, onLongPress } = options;
  const triggerMap = useContext(TabTriggerMapContext);

  const getTrigger = useCallback(
    (name: string) => {
      const config = triggerMap[name];

      if (!config) {
        return;
      }

      return {
        isFocused: state.index === config.index,
        route: state.routes[config.index],
        resolvedHref: stripGroupSegmentsFromPath(appendBaseUrl(config.href)),
        ...config,
      };
    },
    [triggerMap]
  );

  const trigger = name !== undefined ? getTrigger(name) : undefined;

  const switchTab = useCallback(
    (name: string, options?: SwitchToOptions) => {
      const config = triggerMap[name];

      if (config) {
        if (config.type === 'external') {
          return router.navigate(config.href);
        } else {
          return navigation?.dispatch({
            type: 'JUMP_TO',
            payload: {
              name,
              ...options,
            },
          });
        }
      } else {
        return navigation?.dispatch({
          type: 'JUMP_TO',
          payload: {
            name,
          },
        });
      }
    },
    [navigation, triggerMap]
  );

  const handleOnPress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      onPress?.(event);
      if (!trigger) return;
      if (event?.isDefaultPrevented()) return;

      navigation?.emit({
        type: 'tabPress',
        target: trigger.type === 'internal' ? trigger.route.key : trigger?.href,
        canPreventDefault: true,
      });

      if (!shouldHandleMouseEvent(event)) return;

      switchTab(name, { reset: reset !== 'onLongPress' ? reset : undefined });
    },
    [onPress, name, reset, trigger]
  );

  const handleOnLongPress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      onPress?.(event);
      if (!trigger) return;
      if (event?.isDefaultPrevented()) return;

      navigation?.emit({
        type: 'tabLongPress',
        target: trigger.type === 'internal' ? trigger.route.key : trigger?.href,
      });

      if (!shouldHandleMouseEvent(event)) return;

      switchTab(name, {
        reset: reset === 'onLongPress' ? 'always' : reset,
      });
    },
    [onLongPress, name, reset, trigger]
  );

  const triggerProps = {
    isFocused: Boolean(trigger?.isFocused),
    onPress: handleOnPress,
    onLongPress: handleOnLongPress,
  };

  return {
    switchTab,
    getTrigger,
    trigger,
    triggerProps,
  };
}

const styles = StyleSheet.create({
  tabTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
