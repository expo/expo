import { requireNativeModule } from 'expo';

import type { ExpoAppMetricsModuleType } from './types';

export default requireNativeModule<ExpoAppMetricsModuleType>('ExpoAppMetrics');
