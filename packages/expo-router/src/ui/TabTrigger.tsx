import { Slot } from '@radix-ui/react-slot';
import { ReactNode, useContext, ReactElement, ComponentProps, useCallback } from 'react';
import { View, StyleSheet, Pressable, PressableProps } from 'react-native';

import { TabTriggerMapContext } from './TabContext';
import { ExpoTabsResetValue } from './TabRouter';
import { appendBaseUrl } from '../fork/getPathFromState';
import { router } from '../imperative-api';
import { shouldHandleMouseEvent } from '../link/useLinkToPathProps';
import { stripGroupSegmentsFromPath } from '../matchers';
import type { Href } from '../types';
import { useNavigatorContext } from '../views/Navigator';

type PressablePropsWithoutFunctionChildren = Omit<PressableProps, 'children'> & {
  children?: ReactNode | undefined;
};

export type TabTriggerProps<T extends string | object> = PressablePropsWithoutFunctionChildren & {
  name: string;
  href?: Href<T>;
  /** Forward props to child component. Useful for custom wrappers. */
  asChild?: boolean;
  /** Reset the route when switching to the tab */
  reset?: SwitchToOptions['reset'] | 'onLongPress';
};

export type TabTriggerOptions<T extends string | object> = {
  name: string;
  href: Href<T>;
};

export type TabTriggerSlotProps = PressablePropsWithoutFunctionChildren &
  React.RefAttributes<View> & {
    isFocused?: boolean;
    href?: string;
  };

const TabTriggerSlot = Slot as React.ForwardRefExoticComponent<TabTriggerSlotProps>;

export function TabTrigger<T extends string | object>({
  asChild,
  name,
  href,
  reset = 'onFocus',
  ...props
}: TabTriggerProps<T>) {
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

export function isTabTrigger(
  child: ReactElement<any>
): child is ReactElement<ComponentProps<typeof TabTrigger>> {
  return child.type === TabTrigger;
}

export type SwitchToOptions = { reset?: ExpoTabsResetValue };

export function useTabTrigger({ name, reset, onPress, onLongPress }: TabTriggerProps<any>) {
  const { state, navigation } = useNavigatorContext();
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
