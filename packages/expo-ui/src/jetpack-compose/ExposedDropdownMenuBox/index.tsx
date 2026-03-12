import { requireNativeView } from 'expo';
import { ReactNode } from 'react';
import { NativeSyntheticEvent } from 'react-native';

import { ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

const SlotNativeView: React.ComponentType<{
  slotName: string;
  children: React.ReactNode;
}> = requireNativeView('ExpoUI', 'SlotView');

/**
 * Props for the `ExposedDropdownMenuBox` component.
 */
export type ExposedDropdownMenuBoxProps = {
  /**
   * The text displayed in the text field.
   */
  value?: string;
  /**
   * Callback function that is called when the expanded state changes.
   */
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * Whether the dropdown menu is expanded (visible).
   * @default false
   */
  expanded?: boolean;
  /**
   * Slot children for the label and items.
   */
  children?: ReactNode;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeExposedDropdownMenuBoxProps = Omit<ExposedDropdownMenuBoxProps, 'onExpandedChange' | 'children'> & {
  children?: ReactNode;
  onExpandedChange: (event: NativeSyntheticEvent<{ expanded: boolean }>) => void;
};

const ExposedDropdownMenuBoxNativeView: React.ComponentType<NativeExposedDropdownMenuBoxProps> =
  requireNativeView('ExpoUI', 'ExposedDropdownMenuBoxView');

function transformProps(
  props: ExposedDropdownMenuBoxProps
): Omit<NativeExposedDropdownMenuBoxProps, 'children'> {
  const { modifiers, children, onExpandedChange, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    expanded: props.expanded ?? false,
    value: props.value ?? '',
    onExpandedChange: ({ nativeEvent: { expanded } }) => {
      onExpandedChange?.(expanded);
    },
  };
}

/**
 * A label slot for `ExposedDropdownMenuBox`.
 * Wrap text content to display as the text field label.
 *
 * @platform android
 */
function Label(props: { children: ReactNode }) {
  return <SlotNativeView slotName="label">{props.children}</SlotNativeView>;
}

/**
 * Container for items displayed in the dropdown menu.
 * Children should be `DropdownMenuItem` components.
 *
 * @platform android
 */
function Items(props: { children: ReactNode }) {
  return <SlotNativeView slotName="items">{props.children}</SlotNativeView>;
}

/**
 * Displays a text field with a dropdown menu for selecting from a list of options.
 * Wraps Jetpack Compose's `ExposedDropdownMenuBox` component.
 *
 * @platform android
 */
function ExposedDropdownMenuBoxComponent(props: ExposedDropdownMenuBoxProps) {
  return (
    <ExposedDropdownMenuBoxNativeView {...transformProps(props)}>
      {props.children}
    </ExposedDropdownMenuBoxNativeView>
  );
}

ExposedDropdownMenuBoxComponent.Label = Label;
ExposedDropdownMenuBoxComponent.Items = Items;

export { ExposedDropdownMenuBoxComponent as ExposedDropdownMenuBox };
