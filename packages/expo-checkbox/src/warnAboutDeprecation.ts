let didWarn = false;

export function warnAboutDeprecation(): void {
  if (!__DEV__ || didWarn) {
    return;
  }
  didWarn = true;
  console.warn(
    'expo-checkbox: This library is deprecated. Use the `Checkbox` component from `@expo/ui` instead. See https://docs.expo.dev/versions/latest/sdk/ui/universal/checkbox/'
  );
}
