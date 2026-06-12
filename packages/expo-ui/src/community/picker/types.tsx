import { Children, isValidElement, type Ref, type ReactNode, type ReactElement } from 'react';
import { StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

export type PickerItemValue = string | number | null;

/**
 * Props for the `Picker.Item` component.
 * Compatible with `@react-native-picker/picker`.
 */
export type PickerItemProps<T extends PickerItemValue = PickerItemValue> = {
  /**
   * Display text for the item.
   */
  label?: string;
  /**
   * Value passed to `onValueChange` when this item is selected.
   */
  value?: T;
  /**
   * Text color for the item. Equivalent to setting `color` in the `style` prop.
   */
  color?: string;
  /**
   * Custom font family for the item. Equivalent to setting `fontFamily` in the `style` prop.
   */
  fontFamily?: string;
  /**
   * Style applied to the item label. Only the following values take effect:
   * `color`, `backgroundColor`, `fontFamily`, and `fontSize`. When also set
   * via the top-level `color` or `fontFamily` props, values from `style` win.
   */
  style?: StyleProp<TextStyle>;
  /**
   * Whether the item is enabled.
   * @platform android
   */
  enabled?: boolean;
  /**
   * Test identifier.
   */
  testID?: string;
};

/**
 * Data-only component used to define options within a `Picker`.
 * Does not render anything — the parent `Picker` extracts props from these children.
 */
export function PickerItem<T extends PickerItemValue>(
  _props: PickerItemProps<T>
): ReactElement | null {
  return null;
}

/**
 * Props for the `Picker` component.
 * Compatible with `@react-native-picker/picker`.
 */
export type PickerProps<T extends PickerItemValue = PickerItemValue> = {
  /**
   * Ref handle exposing `focus()` and `blur()` methods.
   */
  ref?: Ref<PickerRef>;
  /**
   * The currently selected value. Must match the `value` of one of the `Picker.Item` children.
   */
  selectedValue?: T;
  /**
   * Callback when an item is selected. Called with `(itemValue, itemIndex)`.
   */
  onValueChange?: (itemValue: T, itemIndex: number) => void;
  /**
   * Whether the picker is enabled.
   */
  enabled?: boolean;
  /**
   * Style applied to the picker container.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Test identifier.
   */
  testID?: string;
  /**
   * `Picker.Item` children that define the available options.
   */
  children?: ReactNode;
};

/**
 * Ref handle for the `Picker` component.
 * Compatible with `@react-native-picker/picker`.
 */
export type PickerRef = {
  /**
   * Programmatically opens the picker.
   * @platform android
   */
  focus: () => void;
  /**
   * Programmatically closes the picker.
   * @platform android
   */
  blur: () => void;
};

export type ExtractedPickerItem<T extends PickerItemValue = PickerItemValue> = {
  label: string;
  value: T;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: number;
  enabled?: boolean;
};

/**
 * Extracts `Picker.Item` children props into an array of item entries.
 */
export function extractPickerItems<T extends PickerItemValue>(
  children: ReactNode
): ExtractedPickerItem<T>[] {
  return Children.toArray(children)
    .filter(
      (child): child is ReactElement<PickerItemProps<T>> =>
        isValidElement(child) && child.type === PickerItem
    )
    .map(({ props: { label = '', value, color, fontFamily, style, enabled } }) => {
      const flat = StyleSheet.flatten(style);
      return {
        label,
        value: value as T,
        color: (flat?.color as string | undefined) ?? color,
        backgroundColor: flat?.backgroundColor as string | undefined,
        fontFamily: flat?.fontFamily ?? fontFamily,
        fontSize: flat?.fontSize,
        enabled,
      };
    });
}
