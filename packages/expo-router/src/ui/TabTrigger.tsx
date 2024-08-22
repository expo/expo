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
  reset?: boolean | 'longPress';
};

export type TabTriggerOptions<T extends string | object> = {
  name: string;
  href: Href<T>;
};

export type TabTriggerSlotProps = PressablePropsWithoutFunctionChildren &
  React.RefAttributes<View> & {
    isFocused?: boolean;
  };

const TabTriggerSlot = Slot as React.ForwardRefExoticComponent<TabTriggerSlotProps>;

export function TabTrigger<T extends string | object>({
  asChild,
  name,
  href,
  reset,
  ...props
}: TabTriggerProps<T>) {
  const { switchTab, isFocused } = useTabTrigger();

  const pressReset = reset === true;
  const longPressReset =
    reset === true || typeof reset === 'string' ? reset === 'longPress' : Boolean(reset);

  const handleOnPress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      props.onPress?.(event);
      if (event?.isDefaultPrevented()) {
        return;
      }
      switchTab(name, pressReset);
    },
    [props.onPress, pressReset]
  );

  const handleOnLongPress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      props.onLongPress?.(event);
      if (event?.isDefaultPrevented()) {
        return;
      }
      switchTab(name, longPressReset);
    },
    [props.onPress]
  );

  // Pressable doesn't accept the extra props, so only pass them if we are using asChild
  if (asChild) {
    return (
      <TabTriggerSlot
        style={styles.tabTrigger}
        {...props}
        onPress={handleOnPress}
        onLongPress={handleOnLongPress}
        isFocused={isFocused(name)}>
        {props.children}
      </TabTriggerSlot>
    );
  } else {
    return (
      <Pressable
        style={styles.tabTrigger}
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

export function useTabTrigger() {
  const navigation = useNavigation();
  const triggerMap = useContext(TabTriggerMapContext);
  const state = useContext(TabsStateContext);

  const switchTab = useCallback(
    (name: string, reset?: boolean) => {
      const config = triggerMap[name];

      if (!config) {
        throw new Error(`Unable to find trigger with name ${name}`);
      }

      if (config.type === 'internal') {
        const action: Extract<ExpoTabActionType, { type: 'SWITCH_TABS' }> = {
          type: 'SWITCH_TABS',
          source: '',
          payload: {
            name,
            reset,
          },
        };

        return navigation.dispatch(action);
      } else {
        return router.navigate(config.href);
      }
    },
    [navigation, triggerMap]
  );

  const isFocused = useCallback(
    (name: string) => {
      const config = triggerMap[name];

      if (!config) {
        throw new Error(`Unable to find trigger with name ${name}`);
      }

      return state.index === config.index;
    },
    [triggerMap]
  );

  return {
    switchTab,
    isFocused,
  };
}

const styles = StyleSheet.create({
  tabTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
