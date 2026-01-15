import { createModifier } from './createModifier';

/**
 * Sets a SwiftUI environment value.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/environment(_:_:)).
 */
export const environment = (
  key: 'editMode' | 'colorScheme',
  value: 'active' | 'inactive' | 'transient' | 'light' | 'dark'
) => createModifier('environment', { key, value });
