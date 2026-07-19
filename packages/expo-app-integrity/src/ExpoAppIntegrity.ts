import { requireNativeModule } from 'expo';

import type { ExpoAppIntegrityModule } from './ExpoAppIntegrity.types';

/**
 * @hidden
 */
export default requireNativeModule<ExpoAppIntegrityModule>('ExpoAppIntegrity');
