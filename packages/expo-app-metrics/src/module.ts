import { requireNativeModule } from 'expo';

import type { Session } from './Session';
import type { ExpoAppMetricsModuleType } from './types';

const AppMetrics = requireNativeModule<ExpoAppMetricsModuleType>('ExpoAppMetrics');

// The native main session lives for the whole process, but its JS wrapper is a regular shared
// object whose registry pairing is dropped once nothing references it. Hold one wrapper so repeated
// calls return the same object and an un-awaited `addMetric` on it can't race the collector.
let mainSession: Session | undefined;
const getMainSession = AppMetrics.getMainSession.bind(AppMetrics);
AppMetrics.getMainSession = () => (mainSession ??= getMainSession());

export default AppMetrics;
