import { createModifier } from './createModifier';

export type EnvironmentConfig =
  | { key: 'editMode'; value: 'active' | 'inactive' | 'transient' }
  | { key: 'colorScheme'; value: 'light' | 'dark' }
  | { key: 'locale'; value: string }
  | { key: 'timeZone'; value: string };

/**
 * Sets a SwiftUI environment value.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/environment(_:_:)).
 */
export function environment(config: EnvironmentConfig): ReturnType<typeof createModifier>;
export function environment(
  key: EnvironmentConfig['key'],
  value: string
): ReturnType<typeof createModifier>;
export function environment(configOrKey: EnvironmentConfig | string, value?: string) {
  if (typeof configOrKey === 'string') {
    return createModifier('environment', { key: configOrKey, value });
  }
  return createModifier('environment', configOrKey);
}
