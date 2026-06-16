import type { PickerItemValue, PickerProps } from './types';
/**
 * Android implementation of `Picker`.
 * Renders a Material 3 `ExposedDropdownMenuBox`.
 * `appearance` is accepted for API parity but ignored — Material 3 has no wheel-style picker.
 */
export declare function Picker<T extends PickerItemValue>({ selectedValue, onValueChange, enabled, children, ref, }: PickerProps<T>): import("react/jsx-runtime").JSX.Element;
export * from './types';
//# sourceMappingURL=Picker.android.d.ts.map