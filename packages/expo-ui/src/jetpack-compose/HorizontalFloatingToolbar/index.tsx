import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';

import type { ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type HorizontalFloatingToolbarColors = {
  /**
   * Color of the toolbar container (background).
   */
  toolbarContainerColor?: ColorValue;

  /**
   *  Color of the toolbar content (icons/text).
   */
  toolbarContentColor?: ColorValue;

  /**
   * Color of the floating action button container (background).
   */
  fabContainerColor?: ColorValue;

  /**
   *  Color of the floating action button content (icon).
   */
  fabContentColor?: ColorValue;
};

export type HorizontalFloatingToolbarProps = {
  /**
   * The variant of the horizontal floating toolbar.
   * @default 'standard'
   */
  variant?: 'standard' | 'vibrant';

  /**
   * Per-slot color overrides. Any field set here replaces the corresponding
   * color from the variant default; unset fields fall back to the variant.
   */
  colors?: HorizontalFloatingToolbarColors;

  /**
   * The children of the component.
   */
  children: React.ReactNode;

  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

export type HorizontalFloatingToolbarFloatingActionButtonProps = {
  /**
   * A callback that is called when the button is pressed.
   */
  onPress?: () => void;

  /**
   * The children of the component.
   */
  children: React.ReactNode;
};

type NativeHorizontalFloatingToolbarProps = HorizontalFloatingToolbarProps & {};

type NativeSlotViewProps = {
  slotName: string;
  onSlotEvent?: () => void;
  children: React.ReactNode;
};

const HorizontalFloatingToolbarNativeView: React.ComponentType<NativeHorizontalFloatingToolbarProps> =
  requireNativeView('ExpoUI', 'HorizontalFloatingToolbarView');

// Internal slot marker component - not exported
const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

/**
 * FloatingActionButton component for HorizontalFloatingToolbar.
 * This component marks its children to be rendered in the FAB slot.
 */
export function HorizontalFloatingToolbarFloatingActionButton(
  props: HorizontalFloatingToolbarFloatingActionButtonProps
) {
  return (
    <SlotNativeView slotName="floatingActionButton" onSlotEvent={props.onPress}>
      {props.children}
    </SlotNativeView>
  );
}

function transformHorizontalFloatingToolbarProps(
  props: HorizontalFloatingToolbarProps
): NativeHorizontalFloatingToolbarProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * Renders a `HorizontalFloatingToolbar` component.
 * A horizontal toolbar that floats above content, typically used for action buttons.
 */
function HorizontalFloatingToolbar(props: HorizontalFloatingToolbarProps) {
  return (
    <HorizontalFloatingToolbarNativeView {...transformHorizontalFloatingToolbarProps(props)}>
      {props.children}
    </HorizontalFloatingToolbarNativeView>
  );
}

HorizontalFloatingToolbar.FloatingActionButton = HorizontalFloatingToolbarFloatingActionButton;

export { HorizontalFloatingToolbar };
