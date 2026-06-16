import type { ReactNode, Ref } from 'react';
/**
 * The type of values a [`Picker.Item`](#pickeritem) can carry.
 */
export type PickerItemValue = string | number;
/**
 * Visual appearance of the picker.
 *
 * - `'menu'` — Compact button that opens a popup/dropdown on tap.
 *   Cross-platform default.
 * - `'wheel'` — Scrollable rotor UI that's always visible inline.
 *   iOS only; on Android and web this falls back to the platform's default dropdown.
 */
export type PickerAppearance = 'wheel' | 'menu';
/**
 * Props for the [`Picker.Item`](#pickeritem) component.
 * A data-only marker used to declare options inside a [`Picker`](#picker).
 */
export interface PickerItemProps<T extends PickerItemValue = PickerItemValue> {
    /**
     * Display text for this option.
     */
    label: string;
    /**
     * Value passed to `onValueChange` when this option is selected.
     */
    value: T;
}
/**
 * Props for the [`Picker`](#picker) component, a single-selection input.
 */
export interface PickerProps<T extends PickerItemValue = PickerItemValue> {
    /**
     * The currently selected value.
     * Must match the `value` of one of the `<Picker.Item>` children.
     */
    selectedValue: T;
    /**
     * Called when the user selects an option.
     */
    onValueChange: (value: T) => void;
    /**
     * Visual appearance of the picker.
     * See [`PickerAppearance`](#pickerappearance).
     * @default 'menu'
     */
    appearance?: PickerAppearance;
    /**
     * Whether the picker accepts input.
     * @default true
     */
    enabled?: boolean;
    /**
     * `<Picker.Item>` children that declare the available options.
     */
    children?: ReactNode;
    /**
     * Identifier used to locate the component in end-to-end tests.
     */
    testID?: string;
    /**
     * Forwarded to the underlying native view: the SwiftUI view on iOS, the Jetpack
     * Compose view on Android, or the rendered React Native element on web. An escape
     * hatch for advanced cases that need the native handle; not part of the public API.
     * @hidden
     */
    ref?: Ref<any>;
}
/**
 * Internal: extracted item data from `<Picker.Item>` children.
 */
export interface ExtractedPickerItem<T extends PickerItemValue = PickerItemValue> {
    label: string;
    value: T;
}
//# sourceMappingURL=types.d.ts.map