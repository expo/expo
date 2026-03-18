import * as React from 'react';
import { PickerItem, type PickerItemValue, type PickerProps } from './types';
/**
 * A drop-in replacement for `@react-native-picker/picker` on iOS.
 * Renders a SwiftUI wheel picker wrapped in a Host.
 */
declare function PickerComponent<T extends PickerItemValue>(props: PickerProps<T>): React.JSX.Element;
export declare const Picker: typeof PickerComponent & {
    Item: typeof PickerItem;
};
export {};
//# sourceMappingURL=Picker.d.ts.map