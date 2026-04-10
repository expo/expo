import type { BottomSheetMethods, BottomSheetProps } from './types';
export { useBottomSheet } from './context';
/**
 * iOS implementation of `BottomSheet` using native SwiftUI sheets.
 *
 * @remarks Uses SwiftUI's `.sheet()` presentation (modal overlay).
 */
export declare const BottomSheet: import("react").ForwardRefExoticComponent<BottomSheetProps & import("react").RefAttributes<BottomSheetMethods>>;
//# sourceMappingURL=BottomSheet.ios.d.ts.map