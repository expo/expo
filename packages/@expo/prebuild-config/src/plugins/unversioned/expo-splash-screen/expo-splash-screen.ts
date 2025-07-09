import { withAndroidSplashScreen } from './withAndroidSplashScreen';
import { withIosSplashScreen } from './withIosSplashScreen';
import { createLegacyPlugin } from '../createLegacyPlugin';

export default createLegacyPlugin({
  packageName: 'expo-splash-screen',
  fallback: [withAndroidSplashScreen, withIosSplashScreen],
});
