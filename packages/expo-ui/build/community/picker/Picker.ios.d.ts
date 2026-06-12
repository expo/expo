import * as React from 'react';
import { type PickerItemProps, type PickerItemValue, type PickerProps } from './types';
/**
 * A drop-in replacement for `@react-native-picker/picker` on iOS.
 * Renders a SwiftUI wheel picker wrapped in a Host.
 */
export declare function Picker<T extends PickerItemValue>(props: PickerProps<T>): import("react/jsx-runtime").JSX.Element;
export declare namespace Picker {
    var Item: React.ComponentType<PickerItemProps>;
}
//# sourceMappingURL=Picker.ios.d.ts.map