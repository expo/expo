import * as React from 'react';
import { PickerItem, type PickerProps } from './types';
/**
 * A drop-in replacement for `@react-native-picker/picker` on Android.
 * Renders a Material 3 `SingleChoiceSegmentedButtonRow` wrapped in a Host.
 */
declare function PickerComponent(props: PickerProps): React.JSX.Element;
export declare const Picker: typeof PickerComponent & {
    Item: typeof PickerItem;
};
export {};
//# sourceMappingURL=Picker.android.d.ts.map