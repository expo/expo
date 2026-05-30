import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig, type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers';

type SlotProps = {
  children: React.ReactNode;
};

type NativeSlotViewProps = {
  slotName: string;
  children: React.ReactNode;
};

/**
 * Colors for navigation bar items in different states.
 */
export type NavigationBarItemColors = {
  selectedIconColor?: ColorValue;
  selectedTextColor?: ColorValue;
  selectedIndicatorColor?: ColorValue;
  unselectedIconColor?: ColorValue;
  unselectedTextColor?: ColorValue;
  disabledIconColor?: ColorValue;
  disabledTextColor?: ColorValue;
};

export type NavigationBarProps = {
  /**
   * Background color of the navigation bar.
   * @default NavigationBarDefaults.containerColor
   */
  containerColor?: ColorValue;
  /**
   * Preferred content color inside the navigation bar.
   * @default contentColorFor(containerColor)
   */
  contentColor?: ColorValue;
  /**
   * Tonal elevation in dp.
   * @default NavigationBarDefaults.Elevation
   */
  tonalElevation?: number;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Navigation bar items.
   */
  children?: React.ReactNode;
};

export type NavigationBarItemProps = {
  /**
   * Whether this item is currently selected.
   */
  selected: boolean;
  /**
   * Callback that is called when the item is clicked.
   */
  onClick?: () => void;
  /**
   * Whether the item is enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether to always show the label.
   * @default true
   */
  alwaysShowLabel?: boolean;
  /**
   * Colors for the item in different states.
   */
  colors?: NavigationBarItemColors;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing `Icon`, `SelectedIcon`, and `Label` slots.
   */
  children?: React.ReactNode;
};

type NativeNavigationBarItemProps = Omit<NavigationBarItemProps, 'onClick'> &
  ViewEvent<'onButtonPressed', void>;

const NavigationBarNativeView: React.ComponentType<NavigationBarProps> = requireNativeView(
  'ExpoUI',
  'NavigationBarView'
);

const NavigationBarItemNativeView: React.ComponentType<NativeNavigationBarItemProps> =
  requireNativeView('ExpoUI', 'NavigationBarItemView');

const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

function transformNavigationBarProps(props: NavigationBarProps): NavigationBarProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

function transformNavigationBarItemProps(
  props: NavigationBarItemProps
): NativeNavigationBarItemProps {
  const { modifiers, onClick, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onButtonPressed: () => onClick?.(),
  };
}

/**
 * Icon slot for `NavigationBarItem`.
 */
function NavigationBarItemIcon(props: SlotProps) {
  return <SlotNativeView slotName="icon">{props.children}</SlotNativeView>;
}

/**
 * Selected icon slot for `NavigationBarItem`. Falls back to `Icon` when omitted.
 */
function NavigationBarItemSelectedIcon(props: SlotProps) {
  return <SlotNativeView slotName="selectedIcon">{props.children}</SlotNativeView>;
}

/**
 * Label slot for `NavigationBarItem`.
 */
function NavigationBarItemLabel(props: SlotProps) {
  return <SlotNativeView slotName="label">{props.children}</SlotNativeView>;
}

/**
 * A Material Design 3 navigation bar.
 */
export function NavigationBar(props: NavigationBarProps) {
  const { children, ...restProps } = props;
  return (
    <NavigationBarNativeView {...transformNavigationBarProps(restProps)}>
      {children}
    </NavigationBarNativeView>
  );
}

/**
 * A Material Design 3 navigation bar item. Must be used inside `NavigationBar`.
 */
function NavigationBarItemComponent(props: NavigationBarItemProps) {
  const { children, ...restProps } = props;
  return (
    <NavigationBarItemNativeView {...transformNavigationBarItemProps(restProps)}>
      {children}
    </NavigationBarItemNativeView>
  );
}

NavigationBarItemComponent.Icon = NavigationBarItemIcon;
NavigationBarItemComponent.SelectedIcon = NavigationBarItemSelectedIcon;
NavigationBarItemComponent.Label = NavigationBarItemLabel;

export { NavigationBarItemComponent as NavigationBarItem };
