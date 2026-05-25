import { requireNativeModule } from 'expo-modules-core';

import type { ExpoUpdatesModule } from './ExpoUpdatesModule.types';

/**
 * @internal
 */
export default requireNativeModule<ExpoUpdatesModule>('ExpoUpdates');
