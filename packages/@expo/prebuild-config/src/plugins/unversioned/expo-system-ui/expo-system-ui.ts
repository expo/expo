import { createLegacyPlugin } from '../createLegacyPlugin';
import { withAndroidRootViewBackgroundColor } from './withAndroidRootViewBackgroundColor';
import { withAndroidUserInterfaceStyle } from './withAndroidUserInterfaceStyle';
import { withIosRootViewBackgroundColor } from './withIosRootViewBackgroundColor';
import { withIosUserInterfaceStyle } from './withIosUserInterfaceStyle';

export default createLegacyPlugin({
  packageName: 'expo-system-ui',
  fallback: [
    withAndroidRootViewBackgroundColor,
    withIosRootViewBackgroundColor,
    withAndroidUserInterfaceStyle,
    withIosUserInterfaceStyle,
  ],
});
