/**
 * Convert a set to a string type.
 * @example setToType(new Set(['a', 'b'])) => 'a | b'
 * @example setToType() => 'never'
 */
export const setToUnionType = <T>(set: Set<T>) => {
  return set.size > 0 ? [...set].map((s) => `\`${s}\``).join(' | ') : 'never';
};
