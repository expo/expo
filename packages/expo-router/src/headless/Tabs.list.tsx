import { useCallback } from 'react';
import { View, StyleSheet, ViewProps, Pressable, PressableProps } from 'react-native';

import { useTabTrigger } from './Tabs.hooks';
import { ViewSlot, PressableSlot } from './common';
import { Href } from '../types';

export type TabTriggerOptions<T extends string | object> = {
  name: string;
  href: Href<T>;
};

export type TabTriggerProps<T extends string | object> = PressableProps & {
  name: string;
  href?: Href<T>;
  /** Forward props to child component. Useful for custom wrappers. */
  asChild?: boolean;
};

export type TabListProps = ViewProps & {
  /** Forward props to child component and removes the extra <View />. Useful for custom wrappers. */
  asChild?: boolean;
};

export function TabList({ asChild, ...props }: TabListProps) {
  const Comp = asChild ? ViewSlot : View;
  return <Comp style={styles.tabList} {...props} />;
}

export function TabTrigger<T extends string | object>({
  asChild,
  name,
  href,
  ...props
}: TabTriggerProps<T>) {
  const Comp = asChild ? PressableSlot : Pressable;
  const { switchTab } = useTabTrigger();

  const handleOnPress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      props.onPress?.(event);
      if (event?.isDefaultPrevented()) {
        return;
      }
      switchTab(name, href);
    },
    [props.onPress]
  );

  const handleOnLongPress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      props.onLongPress?.(event);
      if (event?.isDefaultPrevented()) {
        return;
      }
      switchTab(name, href);
    },
    [props.onPress]
  );

  return (
    <Comp
      style={styles.tabTrigger}
      {...props}
      onPress={handleOnPress}
      onLongPress={handleOnLongPress}>
      {props.children}
    </Comp>
  );
}

const styles = StyleSheet.create({
  tabList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
