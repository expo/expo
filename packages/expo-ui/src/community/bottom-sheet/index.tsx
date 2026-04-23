import { type ReactNode, useContext, useImperativeHandle, useRef } from 'react';
import { FlatList, ScrollView, SectionList, StyleSheet, TextInput, View } from 'react-native';

import { BottomSheet as BottomSheetComponent } from './BottomSheet';
import { BottomSheetInternalContext } from './context';
import type { BottomSheetMethods, BottomSheetProps, BottomSheetViewProps } from './types';

// Re-export the context hook from the shared context file
export { useBottomSheet } from './context';

// #region BottomSheet / BottomSheetModal with companion types for ref compatibility
// TypeScript declaration merging: the value is the component, the type is the ref interface.
// This allows `useRef<BottomSheet>(null)` and `useRef<BottomSheetModal>(null)` to work
// without needing to import `BottomSheetMethods` separately.

/**
 * Bottom sheet component. Defaults to `index={0}` (open at first snap point on mount).
 */
const BottomSheet = BottomSheetComponent;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- declaration merging so useRef<BottomSheet> resolves to BottomSheetMethods
type BottomSheet = BottomSheetMethods;

/**
 * Modal variant of `BottomSheet`. Always starts closed regardless of the `index` prop.
 * Use `present()` to open at the snap point specified by `index` (defaults to `0`).
 *
 * @remarks In `@gorhom/bottom-sheet`, `BottomSheetModal` ignores `index` for initial
 * visibility and is always opened via `present()`. This matches that behavior.
 */
function BottomSheetModal(props: BottomSheetProps) {
  const { ref, index: presentIndex = 0, ...rest } = props;
  const sheetRef = useRef<BottomSheetMethods>(null);

  useImperativeHandle(
    ref,
    () => ({
      snapToIndex: (i: number) => sheetRef.current?.snapToIndex(i),
      snapToPosition: (p: string | number) => sheetRef.current?.snapToPosition(p),
      expand: () => sheetRef.current?.expand(),
      collapse: () => sheetRef.current?.collapse(),
      close: () => sheetRef.current?.close(),
      forceClose: () => sheetRef.current?.forceClose(),
      present: () => sheetRef.current?.snapToIndex(presentIndex),
      dismiss: () => sheetRef.current?.close(),
    }),
    [presentIndex]
  );

  return <BottomSheetComponent ref={sheetRef} {...rest} index={-1} />;
}
// eslint-disable-next-line @typescript-eslint/no-redeclare -- declaration merging so useRef<BottomSheetModal> resolves to BottomSheetMethods
type BottomSheetModal = BottomSheetMethods;

// #endregion

// #region BottomSheetView

/**
 * A wrapper for content inside a `BottomSheet`.
 * In `@gorhom/bottom-sheet`, this enables dynamic content sizing.
 *
 * @remarks When `enableDynamicSizing` is active (no `snapPoints` provided),
 * `flex` styles are automatically stripped so the sheet can measure content height.
 */
function BottomSheetView({ children, style }: BottomSheetViewProps) {
  const { fitToContents } = useContext(BottomSheetInternalContext);
  const resolvedStyle = fitToContents && style ? stripFlexStyle(style) : style;
  return <View style={resolvedStyle}>{children}</View>;
}

function stripFlexStyle(style: BottomSheetViewProps['style']): BottomSheetViewProps['style'] {
  const flat = StyleSheet.flatten(style);
  if (!flat) return style;
  const { flex: _, flexGrow: _g, flexShrink: _s, flexBasis: _b, ...rest } = flat as any;
  return rest;
}

// #endregion

// #region Scroll wrappers

/**
 * A scrollable view for use inside a `BottomSheet`.
 *
 * @remarks This is a direct re-export of React Native's `ScrollView`.
 * Native platform sheets handle scroll coordination automatically,
 * so no special gesture handling is needed (unlike `@gorhom/bottom-sheet`
 * which overrides scroll behavior for gesture coordination).
 */
const BottomSheetScrollView = ScrollView;

/**
 * A flat list for use inside a `BottomSheet`.
 *
 * @remarks This is a direct re-export of React Native's `FlatList`.
 * See `BottomSheetScrollView` remarks for details.
 */
const BottomSheetFlatList = FlatList;

/**
 * A section list for use inside a `BottomSheet`.
 *
 * @remarks This is a direct re-export of React Native's `SectionList`.
 * See `BottomSheetScrollView` remarks for details.
 */
const BottomSheetSectionList = SectionList;

/**
 * A text input for use inside a `BottomSheet`.
 *
 * @remarks This is a direct re-export of React Native's `TextInput`.
 * Native platform sheets handle keyboard behavior automatically.
 */
const BottomSheetTextInput = TextInput;

// #endregion

// #region Modal

/**
 * Provider for `BottomSheetModal`.
 *
 * @remarks In this implementation, no provider is needed since modal presentation
 * is handled natively. This component simply renders its children for API compatibility.
 */
function BottomSheetModalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// #endregion

// Default export
export default BottomSheet;

export {
  BottomSheet,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetFlatList,
  BottomSheetSectionList,
  BottomSheetTextInput,
  BottomSheetModal,
  BottomSheetModalProvider,
};

// Type exports
export type {
  BottomSheetProps,
  BottomSheetMethods,
  BottomSheetViewProps,
  BottomSheetHandleProps,
  BottomSheetBackdropProps,
  BottomSheetBackgroundProps,
  BottomSheetFooterProps,
} from './types';

// Re-export type-only aliases for scroll component props (API compat)
export type { ScrollViewProps as BottomSheetScrollViewProps } from 'react-native';
export type { FlatListProps as BottomSheetFlatListProps } from 'react-native';
export type { SectionListProps as BottomSheetSectionListProps } from 'react-native';
export type { TextInputProps as BottomSheetTextInputProps } from 'react-native';
