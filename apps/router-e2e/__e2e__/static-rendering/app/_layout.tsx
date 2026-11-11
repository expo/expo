import * as Font from 'expo-font';
import { Slot, Stack, usePathname } from 'expo-router';

import '../safe-area.css';

export default function Layout() {
  const pathname = usePathname();
  const [isLoaded] = Font.useFonts({ sweet: require('../sweet.ttf') });

  // This is important for the test because static font extraction will ensure this is never called
  // with static websites. We can test by seeing if the app has HTML rendered.
  if (!isLoaded) {
    return null;
  }

  if (pathname === '/safe-area') {
    return <Slot />;
  }

  return (
    <Stack screenOptions={pathname === '/safe-area-stack' ? { headerShown: false } : undefined} />
  );
}
