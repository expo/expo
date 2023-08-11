import { withAndroidAdMob } from './withAndroidAdMob';
import { withIosAdMob } from './withIosAdMob';
import { createLegacyPlugin } from '../createLegacyPlugin';

export default createLegacyPlugin({
  packageName: 'expo-ads-admob',
  fallback: [withAndroidAdMob, withIosAdMob],
});
