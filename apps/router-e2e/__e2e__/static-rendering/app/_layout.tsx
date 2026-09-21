import * as Font from 'expo-font';
import { Stack } from 'expo-router';

export default function Layout() {
  const [isLoaded] = Font.useFonts({ sweet: require('../sweet.ttf') });

  // This is important for the test because static font extraction will ensure this is never called
  // with static websites. We can test by seeing if the app has HTML rendered.
  if (!isLoaded) {
    return null;
  }

  return <Stack />;
}
