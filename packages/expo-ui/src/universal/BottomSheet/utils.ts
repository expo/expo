import type { ColorValue } from 'react-native';

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

/**
 * Narrows a `containerColor` prop to the plain hex/CSS-color string that the web and iOS
 * implementations can consume, discarding it (falling back to each platform's own default)
 * when it's `undefined` or an `OpaqueColorValue` (e.g. `PlatformColor()`/`DynamicColorIOS()`) —
 * neither web's inline style nor `presentationBackground` accepts those.
 */
export function resolveStringColor(color: ColorValue | undefined): string | undefined {
  return typeof color === 'string' ? color : undefined;
}
