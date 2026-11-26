import * as Font from 'expo-font';
import { Slot } from 'expo-router';

import '@/styles/safe-area.css';

export default function RenderingLayout() {
  const [isLoaded] = Font.useFonts({ sweet: require('../../assets/fonts/sweet.ttf') });

  // This is important for the test because static font extraction will ensure this is never called
  // with static websites. We can test by seeing if the app has HTML rendered.
  if (!isLoaded) {
    return null;
  }

  return <Slot />;
}
