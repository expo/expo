import { requireOptionalNativeModule } from 'expo';

import { ExpoAppMetricsShim } from './ExpoAppMetricsShim';
import type { ExpoAppMetricsModuleType } from './types';

// Hosts that leave expo-app-metrics out, such as Expo Go, have no native module. Fall back to the
// shim so importing the package never throws.
export default requireOptionalNativeModule<ExpoAppMetricsModuleType>('ExpoAppMetrics') ??
  new ExpoAppMetricsShim();
