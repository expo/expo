import { createLegacyPlugin } from '../createLegacyPlugin';
import { withAndroidSplashScreen } from './withAndroidSplashScreen';
import { withIosSplashScreen } from './withIosSplashScreen';

export default createLegacyPlugin({
  packageName: 'expo-splash-screen',
  fallback: [withAndroidSplashScreen, withIosSplashScreen],
});
