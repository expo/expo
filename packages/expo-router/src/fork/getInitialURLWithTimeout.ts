import * as ExpoLinking from 'expo-linking';
import { Linking, Platform } from 'react-native';

export function getInitialURLWithTimeout(): string | null | Promise<string | null> {
  if (typeof window === 'undefined') {
    return '';
  } else if (Platform.OS === 'ios') {
    // Use the new Expo API for iOS. This has better support for App Clips and handoff.
    return ExpoLinking.getLinkingURL();
  }

  return Promise.race([
    // TODO: Phase this out in favor of expo-linking on Android.
    Linking.getInitialURL(),
    new Promise<null>((resolve) =>
      // Timeout in 150ms if `getInitialState` doesn't resolve
      // Workaround for https://github.com/facebook/react-native/issues/25675
      setTimeout(() => resolve(null), 150)
    ),
  ]);
}
