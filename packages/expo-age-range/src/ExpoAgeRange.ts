import { requireNativeModule } from 'expo-modules-core';

import type { ExpoAgeRangeModule } from './ExpoAgeRange.types';

/**
 * @hidden
 */
export default requireNativeModule<ExpoAgeRangeModule>('ExpoAgeRange');
