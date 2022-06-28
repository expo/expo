import { createLegacyPlugin } from '../createLegacyPlugin';
import { withNavigationBar } from './withAndroidNavigationBar';

export default createLegacyPlugin({
  packageName: 'expo-navigation-bar',
  fallback: [
    // Android
    withNavigationBar,
  ],
});
