import { Slot } from '@radix-ui/react-slot';
import { useNavigation } from '@react-navigation/native';
import { ReactNode, useContext, ReactElement, ComponentProps, useCallback } from 'react';
import { View, StyleSheet, Pressable, PressableProps } from 'react-native';

import { TabTriggerMapContext, TabsStateContext } from './TabContext';
import { ExpoTabActionType } from './TabRouter';
import { router } from '../imperative-api';
import { Href } from '../types';

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
    href: string;
  };

const TabTriggerSlot = Slot as React.ForwardRefExoticComponent<TabTriggerSlotProps>;

export function TabTrigger<T extends string | object>({
  asChild,
  name,
  href,
  reset = 'onFocus',
  ...props
}: TabTriggerProps<T>) {
  const { switchTab, trigger } = useTabTrigger(name);

  if (!trigger) {
    throw new Error(`Unable to locate trigger with name ${name}`);
  }

  const handleOnPress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      props.onPress?.(event);
      if (event?.isDefaultPrevented()) {
        return;
      }
      switchTab(name, { reset: reset !== 'onLongPress' ? reset : undefined });
    },
    [props.onPress, name, reset]
  );

  const handleOnLongPress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      props.onLongPress?.(event);
      if (event?.isDefaultPrevented()) {
        return;
      }
      switchTab(name, {
        reset: reset === 'onLongPress' ? 'always' : reset,
      });
    },
    [props.onPress, name, reset]
  );

  // Pressable doesn't accept the extra props, so only pass them if we are using asChild
  if (asChild) {
    return (
      <TabTriggerSlot
        style={styles.tabTrigger}
        {...props}
        onPress={handleOnPress}
        onLongPress={handleOnLongPress}
        isFocused={trigger.isFocused}
        href={trigger.href}>
        {props.children}
      </TabTriggerSlot>
    );
  } else {
    // These props are not typed, but are allowed by React Native Web
    const reactNativeWebProps = { href: trigger.href };

    return (
      <Pressable
        style={styles.tabTrigger}
        {...reactNativeWebProps}
        {...props}
        onPress={handleOnPress}
        onLongPress={handleOnLongPress}>
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

export type SwitchToOptions = Omit<
  Extract<ExpoTabActionType, { type: 'SWITCH_TABS' }>['payload'],
  'name'
>;

export function useTabTrigger(name?: string) {
  const navigation = useNavigation();
  const triggerMap = useContext(TabTriggerMapContext);
  const state = useContext(TabsStateContext);

  const switchTab = useCallback(
    (name: string, options?: SwitchToOptions) => {
      const config = triggerMap[name];

      if (!config) {
        throw new Error(`Unable to find trigger with name ${name}`);
      }

      if (config.type === 'internal') {
        const action: Extract<ExpoTabActionType, { type: 'SWITCH_TABS' }> = {
          type: 'SWITCH_TABS',
          payload: {
            name,
            ...options,
          },
        };

        return navigation.dispatch(action);
      } else {
        return router.navigate(config.href);
      }
    },
    [navigation, triggerMap]
  );

  const getTrigger = useCallback(
    (name: string) => {
      const config = triggerMap[name];

      if (!config) {
        throw new Error(`Unable to find trigger with name ${name}`);
      }

      return {
        isFocused: state.index === config.index,
        ...config,
      };
    },
    [triggerMap]
  );

  return {
    switchTab,
    getTrigger,
    trigger: name !== undefined ? getTrigger(name) : undefined,
  };
}

const styles = StyleSheet.create({
  tabTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
