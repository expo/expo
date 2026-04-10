import type { BottomSheetMethods } from './types';
export declare const BottomSheetContext: import("react").Context<BottomSheetMethods | null>;
/** Internal context for passing layout flags to BottomSheetView. Not part of public API. */
export declare const BottomSheetInternalContext: import("react").Context<{
    fitToContents: boolean;
}>;
/**
 * Hook to access the bottom sheet methods from within its children.
 * Must be used inside a `BottomSheet` component.
 *
 * Returns the same methods available on the `BottomSheet` ref:
 * `snapToIndex`, `snapToPosition`, `expand`, `collapse`, `close`, `forceClose`, `present`, `dismiss`.
 */
export declare function useBottomSheet(): BottomSheetMethods;
//# sourceMappingURL=context.d.ts.map