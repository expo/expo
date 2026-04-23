import { type ReactNode } from 'react';
import { FlatList, ScrollView, SectionList, TextInput } from 'react-native';
import { BottomSheet as BottomSheetComponent } from './BottomSheet';
import type { BottomSheetMethods, BottomSheetProps, BottomSheetViewProps } from './types';
export { useBottomSheet } from './context';
/**
 * Bottom sheet component. Defaults to `index={0}` (open at first snap point on mount).
 */
declare const BottomSheet: typeof BottomSheetComponent;
type BottomSheet = BottomSheetMethods;
/**
 * Modal variant of `BottomSheet`. Always starts closed regardless of the `index` prop.
 * Use `present()` to open at the snap point specified by `index` (defaults to `0`).
 *
 * @remarks In `@gorhom/bottom-sheet`, `BottomSheetModal` ignores `index` for initial
 * visibility and is always opened via `present()`. This matches that behavior.
 */
declare function BottomSheetModal(props: BottomSheetProps): import("react/jsx-runtime").JSX.Element;
type BottomSheetModal = BottomSheetMethods;
/**
 * A wrapper for content inside a `BottomSheet`.
 * In `@gorhom/bottom-sheet`, this enables dynamic content sizing.
 *
 * @remarks When `enableDynamicSizing` is active (no `snapPoints` provided),
 * `flex` styles are automatically stripped so the sheet can measure content height.
 */
declare function BottomSheetView({ children, style }: BottomSheetViewProps): import("react/jsx-runtime").JSX.Element;
/**
 * A scrollable view for use inside a `BottomSheet`.
 *
 * @remarks This is a direct re-export of React Native's `ScrollView`.
 * Native platform sheets handle scroll coordination automatically,
 * so no special gesture handling is needed (unlike `@gorhom/bottom-sheet`
 * which overrides scroll behavior for gesture coordination).
 */
declare const BottomSheetScrollView: typeof ScrollView;
/**
 * A flat list for use inside a `BottomSheet`.
 *
 * @remarks This is a direct re-export of React Native's `FlatList`.
 * See `BottomSheetScrollView` remarks for details.
 */
declare const BottomSheetFlatList: typeof FlatList;
/**
 * A section list for use inside a `BottomSheet`.
 *
 * @remarks This is a direct re-export of React Native's `SectionList`.
 * See `BottomSheetScrollView` remarks for details.
 */
declare const BottomSheetSectionList: typeof SectionList;
/**
 * A text input for use inside a `BottomSheet`.
 *
 * @remarks This is a direct re-export of React Native's `TextInput`.
 * Native platform sheets handle keyboard behavior automatically.
 */
declare const BottomSheetTextInput: typeof TextInput;
/**
 * Provider for `BottomSheetModal`.
 *
 * @remarks In this implementation, no provider is needed since modal presentation
 * is handled natively. This component simply renders its children for API compatibility.
 */
declare function BottomSheetModalProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export default BottomSheet;
export { BottomSheet, BottomSheetView, BottomSheetScrollView, BottomSheetFlatList, BottomSheetSectionList, BottomSheetTextInput, BottomSheetModal, BottomSheetModalProvider, };
export type { BottomSheetProps, BottomSheetMethods, BottomSheetViewProps, BottomSheetHandleProps, BottomSheetBackdropProps, BottomSheetBackgroundProps, BottomSheetFooterProps, } from './types';
export type { ScrollViewProps as BottomSheetScrollViewProps } from 'react-native';
export type { FlatListProps as BottomSheetFlatListProps } from 'react-native';
export type { SectionListProps as BottomSheetSectionListProps } from 'react-native';
export type { TextInputProps as BottomSheetTextInputProps } from 'react-native';
//# sourceMappingURL=index.d.ts.map