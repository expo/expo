import { requireNativeView } from 'expo';

import { ExpoModifier } from '../../types';
import { NativeSyntheticEvent } from 'react-native';

export type NavigationDrawerProps = {
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
  children: React.ReactNode;
  enabled: boolean;
  onDrawerStateChange: (enabled: boolean) => void;
};

type NativeNavigationDrawerProps = Omit<NavigationDrawerProps, 'onDrawerStateChange'> & {
  onDrawerStateChange: (event: NativeSyntheticEvent<{ enabled: boolean }>) => void;
};

/**
 * @hidden
 */
export function transformNavigationDrawerProps(
  props: NavigationDrawerProps
): NativeNavigationDrawerProps {
  return {
    ...props,
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
    onDrawerStateChange: ({ nativeEvent: { enabled } }) => {
      props.onDrawerStateChange(enabled);
    },
  };
}

const NavigationDrawerView: React.ComponentType<NativeNavigationDrawerProps> = requireNativeView(
  'ExpoUI',
  'NavigationDrawerView'
);

/**
 * Renders a `NavigationDrawer` component.
 */
export function NavigationDrawer(props: NavigationDrawerProps) {
  return <NavigationDrawerView {...transformNavigationDrawerProps(props)} />;
}

type NavigationDrawerItemProps = {
  onItemClick: () => void;
  selected: boolean;
  children: React.ReactNode;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};
type NativeNavigationDrawerItemProps = NavigationDrawerItemProps;

export function transformNavigationDrawerItemProps(
  props: NavigationDrawerItemProps
): NativeNavigationDrawerItemProps {
  return {
    ...props,
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
  };
}

const NavigationDrawerItemView: React.ComponentType<NavigationDrawerItemProps> = requireNativeView(
  'ExpoUI',
  'NavigationDrawerItem'
);

/**
 * Renders a `NavigationDrawer` component.
 */
export function NavigationDrawerItem(props: NavigationDrawerItemProps) {
  return <NavigationDrawerItemView {...transformNavigationDrawerItemProps(props)} />;
}
