import { requireNativeModule } from 'expo-modules-core';

import { ExpoAppIntegrityModule } from './ExpoAppIntegrity.types';

/**
 * @hidden
 */
export default requireNativeModule<ExpoAppIntegrityModule>('ExpoAppIntegrity');
