import { requireNativeModule } from 'expo';

import type { ExpoAgeRangeModule } from './ExpoAgeRange.types';

/**
 * @hidden
 */
export default requireNativeModule<ExpoAgeRangeModule>('ExpoAgeRange');
