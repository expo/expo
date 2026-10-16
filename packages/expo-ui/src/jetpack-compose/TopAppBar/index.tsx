import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';

import type { ExpoModifier } from '../../types';
import type { PaddingValuesRecord } from '../Carousel';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Colors for the top app bar.
 */
export type TopAppBarColors = {
  /**
   * Color of the container (background).
   */
  containerColor?: ColorValue;
  /**
   * Color of the navigation icon.
   */
  navigationIconContentColor?: ColorValue;
  /**
   * Color of the title.
   */
  titleContentColor?: ColorValue;
  /**
   * Color of the action icons.
   */
  actionIconContentColor?: ColorValue;
};

export interface TopAppBarProps {
  /**
   * Colors for the app bar. Unset colors use `TopAppBarDefaults.topAppBarColors()`.
   */
  colors?: TopAppBarColors;
  /**
   * Insets in dp that the app bar adds around its content. Sides you omit are `0`.
   * Pass `{}` when a parent view already handles the status bar.
   * When omitted, the app bar uses `TopAppBarDefaults.windowInsets`.
   */
  windowInsets?: PaddingValuesRecord;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
  /**
   * `TopAppBar.Title`, `TopAppBar.NavigationIcon`, and `TopAppBar.Actions` slots.
   */
  children: React.ReactNode;
}

type SlotProps = {
  children: React.ReactNode;
};

type NativeSlotViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const TopAppBarNativeView: React.ComponentType<TopAppBarProps> = requireNativeView(
  'ExpoUI',
  'TopAppBarView'
);

const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

/**
 * Title slot for `TopAppBar`.
 */
function TopAppBarTitle(props: SlotProps) {
  return <SlotNativeView slotName="title">{props.children}</SlotNativeView>;
}

/**
 * Navigation icon slot for `TopAppBar`. It is shown at the start of the app bar.
 */
function TopAppBarNavigationIcon(props: SlotProps) {
  return <SlotNativeView slotName="navigationIcon">{props.children}</SlotNativeView>;
}

/**
 * Actions slot for `TopAppBar`. Its children are shown in a row at the end of the app bar.
 */
function TopAppBarActions(props: SlotProps) {
  return <SlotNativeView slotName="actions">{props.children}</SlotNativeView>;
}

/**
 * A Material 3 small top app bar that shows a title, a navigation icon, and actions.
 */
function TopAppBar(props: TopAppBarProps) {
  const { modifiers, ...restProps } = props;
  return (
    <TopAppBarNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}

TopAppBar.Title = TopAppBarTitle;
TopAppBar.NavigationIcon = TopAppBarNavigationIcon;
TopAppBar.Actions = TopAppBarActions;

export { TopAppBar };
