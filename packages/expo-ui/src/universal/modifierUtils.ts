import type { ModifierConfig } from '../types';

/**
 * Drops derived modifiers that the user overrides through the `modifiers`
 * escape hatch. A user-supplied modifier takes ownership of its `$type`, so
 * the component skips the modifier of that type it would otherwise derive
 * from `style`, `variant`, and similar props.
 *
 * Only pass style-derived modifiers as `derived`. Modifiers backing
 * functional props (for example `onPress`, `onAppear`, `disabled`) must not
 * go through this filter, or a user modifier of the same type would silently
 * disable the prop.
 */
export function omitUserOverridden<T extends { $type: string }>(
  derived: T[],
  userModifiers?: readonly ModifierConfig[]
): T[] {
  if (!userModifiers?.length) {
    return derived;
  }
  const userTypes = new Set(userModifiers.map((modifier) => modifier.$type));
  return derived.filter((modifier) => !userTypes.has(modifier.$type));
}
