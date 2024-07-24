import { withNavigationBar } from './withAndroidNavigationBar';
import { createLegacyPlugin } from '../createLegacyPlugin';

export default createLegacyPlugin({
  packageName: 'expo-navigation-bar',
  fallback: [
    // Android
    withNavigationBar,
  ],
});
