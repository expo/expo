import { withAndroidRootViewBackgroundColor } from './withAndroidRootViewBackgroundColor';
import { withAndroidUserInterfaceStyle } from './withAndroidUserInterfaceStyle';
import { withIosRootViewBackgroundColor } from './withIosRootViewBackgroundColor';
import { withIosUserInterfaceStyle } from './withIosUserInterfaceStyle';
import { createLegacyPlugin } from '../createLegacyPlugin';

export default createLegacyPlugin({
  packageName: 'expo-system-ui',
  fallback: [
    withAndroidRootViewBackgroundColor,
    withIosRootViewBackgroundColor,
    withAndroidUserInterfaceStyle,
    withIosUserInterfaceStyle,
  ],
});
