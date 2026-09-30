export const DEPRECATION_MESSAGE =
  'expo-checkbox: This library is deprecated. Use the `Checkbox` component from `@expo/ui` instead. See https://docs.expo.dev/versions/latest/sdk/ui/universal/checkbox/';

let didWarn = false;

/**
 * Logs the deprecation warning once per app session. Only runs in development.
 * @internal
 */
export function warnAboutDeprecation(): void {
  if (!__DEV__ || didWarn) {
    return;
  }
  didWarn = true;
  console.warn(DEPRECATION_MESSAGE);
}
