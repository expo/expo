import { registerWebModule } from 'expo';

import { ExpoAppMetricsShim } from './ExpoAppMetricsShim';

export * from './types';

export default registerWebModule(ExpoAppMetricsShim, 'ExpoAppMetrics');
