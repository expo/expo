import type { PickerItemValue, PickerProps } from './types';
/**
 * iOS implementation of `Picker`.
 * Wraps SwiftUI's `Picker` and applies the matching `.pickerStyle` for the requested `appearance`.
 * Embed inside a parent `<Host>` (same as `Column` / `Row`).
 */
export declare function Picker<T extends PickerItemValue>({ selectedValue, onValueChange, appearance, enabled, children, testID, ref, }: PickerProps<T>): import("react/jsx-runtime").JSX.Element;
export * from './types';
//# sourceMappingURL=Picker.ios.d.ts.map