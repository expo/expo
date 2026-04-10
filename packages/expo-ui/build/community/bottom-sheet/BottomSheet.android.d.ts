import type { BottomSheetMethods, BottomSheetProps } from './types';
export { useBottomSheet } from './context';
/**
 * Android implementation of `BottomSheet` using Material3 ModalBottomSheet.
 *
 * @remarks Supports two snap states: partially expanded (~50%) and fully expanded.
 * `snapToIndex(0)` maps to partial, `snapToIndex(lastIndex)` maps to expanded.
 */
export declare const BottomSheet: import("react").ForwardRefExoticComponent<BottomSheetProps & import("react").RefAttributes<BottomSheetMethods>>;
//# sourceMappingURL=BottomSheet.android.d.ts.map