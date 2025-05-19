import { requireNativeModule } from 'expo-modules-core';

import { NativeIntegrityModule } from './IntegrityModule.types';

/**
 * @hidden
 */
export default requireNativeModule<NativeIntegrityModule>('ExpoAppIntegrity');
