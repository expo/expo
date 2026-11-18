import { isMaskedViewAvailable } from '../../../elements/MaskedViewNative';

let hasWarned = false;

export function warnIfMaskedViewMissing() {
  if (!__DEV__ || hasWarned || isMaskedViewAvailable) {
    return;
  }
  hasWarned = true;
  console.warn(
    'The back button label in `expo-router/js-stack` is not masked during the `forUIKit` header animation because `@react-native-masked-view/masked-view` is not installed or not linked in the native app. Run `npx expo install @react-native-masked-view/masked-view`, then rebuild the native app.'
  );
}
