import type { BottomSheetProps } from './types';
export { useBottomSheet } from './context';
/**
 * Android implementation of `BottomSheet` using Material3 ModalBottomSheet.
 *
 * @remarks Supports two snap states: partially expanded (~50%) and fully expanded.
 * `snapToIndex(0)` maps to partial, `snapToIndex(lastIndex)` maps to expanded.
 */
export declare function BottomSheet(props: BottomSheetProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=BottomSheet.android.d.ts.map