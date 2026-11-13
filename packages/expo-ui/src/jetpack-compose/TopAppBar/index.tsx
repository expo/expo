import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';

import type { ExpoModifier } from '../../types';
import type { PaddingValuesRecord } from '../Carousel';
import { createViewModifierEventListener } from '../modifiers/utils';

export type { PaddingValuesRecord };

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
   * Insets in dp that the app bar adds around its content. Missing sides are `0`.
   * When omitted, the app bar uses `TopAppBarDefaults.windowInsets`, which assumes
   * the bar is at the top edge of the window, even inside a nested `Host`.
   * Pass `{}` when a parent handles the insets. This removes both the top status
   * bar inset and the horizontal system bar and display cutout insets.
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
 * Navigation icon slot for `TopAppBar`. It appears at the start of the app bar.
 */
function TopAppBarNavigationIcon(props: SlotProps) {
  return <SlotNativeView slotName="navigationIcon">{props.children}</SlotNativeView>;
}

/**
 * Actions slot for `TopAppBar`. Its children appear in a row at the end of the app bar.
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
