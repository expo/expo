import { withAndroidBranch } from './withAndroidBranch';
import { withIosBranch } from './withIosBranch';
import { createLegacyPlugin } from '../createLegacyPlugin';

export default createLegacyPlugin({
  packageName: 'expo-branch',
  fallback: [
    // Android
    withAndroidBranch,
    // iOS
    withIosBranch,
  ],
});
