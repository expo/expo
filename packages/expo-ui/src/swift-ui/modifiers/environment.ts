import { createModifier } from './createModifier';

/**
 * Environment keys for the environment modifier.
 */
export const EnvironmentKey = {
  editMode: 'editMode',
  colorScheme: 'colorScheme',
} as const;

/**
 * Edit mode values for the environment modifier.
 */
export const EditMode = {
  active: 'active',
  inactive: 'inactive',
  transient: 'transient',
} as const;

/**
 * Color scheme values for the environment modifier.
 */
export const ColorScheme = {
  light: 'light',
  dark: 'dark',
} as const;

type EnvironmentKeyType = (typeof EnvironmentKey)[keyof typeof EnvironmentKey];
type EditModeType = (typeof EditMode)[keyof typeof EditMode];
type ColorSchemeType = (typeof ColorScheme)[keyof typeof ColorScheme];

/**
 * Sets a SwiftUI environment value.
 * @param key - The environment key (use EnvironmentKey constants).
 * @param value - The value to set (use `EditMode` or `ColorScheme` constants).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/environment(_:_:)).
 */
export const environment = (key: EnvironmentKeyType, value: EditModeType | ColorSchemeType) =>
  createModifier('environment', { key, value });
