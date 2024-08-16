import { Slot } from '@radix-ui/react-slot';
import { ComponentType, useCallback } from 'react';
import { View, StyleSheet, ViewProps, Pressable, PressableProps } from 'react-native';

import { TabActionType } from './TabsRouter';
import { Href } from '../types';
import { useNavigation } from '../useNavigation';
import { Link } from '../link/Link';

export type TabTriggerOptions<T extends string | object> = {
  name: string;
  href: Href<T>;
};

export type TabTriggerProps<T extends string | object> = PressableProps &
  TabTriggerOptions<T> & {
    name: string;
    /** Forward props to child component. Useful for custom wrappers. */
    asChild?: boolean;
  };

export type TabListProps = ViewProps & {
  /** Forward props to child component and removes the extra <View />. Useful for custom wrappers. */
  asChild?: boolean;
};

export function TabList({ asChild, ...props }: TabListProps) {
  const Element: ComponentType<any> = asChild ? Slot : View;
  return <Element style={styles.tabList} {...props} />;
}

export function TabTrigger2<T extends string | object>({
  asChild,
  name,
  href,
  ...props
}: TabTriggerProps<T>) {
  const Element: ComponentType<any> = asChild ? Slot : Link;

  return (
    <Element style={styles.tabTrigger} {...props} href={href}>
      {props.children}
    </Element>
  );
}

export function TabTrigger<T extends string | object>({
  asChild,
  name,
  href,
  ...props
}: TabTriggerProps<T>) {
  const Element: ComponentType<any> = asChild ? Slot : Pressable;
  const navigation = useNavigation();

  const handleOnPress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      props.onPress?.(event);
      if (!event?.isDefaultPrevented()) {
        navigation.dispatch(TabTrigger.actions.switch(name, href));
      }
    },
    [props.onPress]
  );

  return (
    <Element style={styles.tabTrigger} {...props} onPress={handleOnPress}>
      {props.children}
    </Element>
  );
}

TabTrigger.actions = {
  switch<T extends string | object>(name: string, href?: Href<T>): TabActionType<T> {
    return {
      type: 'SWITCH_TABS',
      payload: {
        name,
        href,
      },
    };
  },
};

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
