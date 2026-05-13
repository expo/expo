import { requireNativeModule } from 'expo-modules-core';

import type { ExpoAppIntegrityModule } from './ExpoAppIntegrity.types';

/**
 * @hidden
 */
export default requireNativeModule<ExpoAppIntegrityModule>('ExpoAppIntegrity');
