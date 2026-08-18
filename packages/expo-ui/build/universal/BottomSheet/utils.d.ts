import type { BottomSheetContentPadding } from './types';
export type ResolvedContentPadding = {
    top: number;
    bottom: number;
    left: number;
    right: number;
};
/**
 * Resolves the `contentPadding` prop against the inset the platform applies when the prop is
 * omitted. A number applies to every edge, and an edge left out of an object is `0`.
 */
export declare function resolveContentPadding(contentPadding: BottomSheetContentPadding | undefined, platformDefault: ResolvedContentPadding): ResolvedContentPadding;
//# sourceMappingURL=utils.d.ts.map