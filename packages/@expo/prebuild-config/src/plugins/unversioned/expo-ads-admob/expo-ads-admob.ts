import { createLegacyPlugin } from '../createLegacyPlugin';
import { withAndroidAdMob } from './withAndroidAdMob';
import { withIosAdMob } from './withIosAdMob';

export default createLegacyPlugin({
  packageName: 'expo-ads-admob',
  fallback: [withAndroidAdMob, withIosAdMob],
});
