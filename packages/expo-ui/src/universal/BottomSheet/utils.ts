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
export function resolveContentPadding(
  contentPadding: BottomSheetContentPadding | undefined,
  platformDefault: ResolvedContentPadding
): ResolvedContentPadding {
  if (contentPadding == null) {
    return platformDefault;
  }
  if (typeof contentPadding === 'number') {
    return {
      top: contentPadding,
      bottom: contentPadding,
      left: contentPadding,
      right: contentPadding,
    };
  }
  return {
    top: contentPadding.top ?? 0,
    bottom: contentPadding.bottom ?? 0,
    left: contentPadding.left ?? 0,
    right: contentPadding.right ?? 0,
  };
}
