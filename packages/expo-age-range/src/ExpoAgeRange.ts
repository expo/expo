import { requireNativeModule } from 'expo-modules-core';

import { ExpoAgeRangeModule } from './ExpoAgeRange.types';

/**
 * @hidden
 */
export default requireNativeModule<ExpoAgeRangeModule>('ExpoAgeRange');
