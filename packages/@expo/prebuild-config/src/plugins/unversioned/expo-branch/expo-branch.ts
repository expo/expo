import { createLegacyPlugin } from '../createLegacyPlugin';
import { withAndroidBranch } from './withAndroidBranch';
import { withIosBranch } from './withIosBranch';

export default createLegacyPlugin({
  packageName: 'expo-branch',
  fallback: [
    // Android
    withAndroidBranch,
    // iOS
    withIosBranch,
  ],
});
