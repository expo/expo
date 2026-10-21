/**
 * Resolves `RNHostView`'s `matchContents` prop to one flag per axis.
 */
export function resolveMatchContents(
  matchContents: boolean | { vertical?: boolean; horizontal?: boolean } | null | undefined
): { horizontal: boolean; vertical: boolean } {
  if (matchContents != null && typeof matchContents === 'object') {
    return {
      horizontal: matchContents.horizontal ?? false,
      vertical: matchContents.vertical ?? false,
    };
  }
  return { horizontal: matchContents ?? false, vertical: matchContents ?? false };
}
