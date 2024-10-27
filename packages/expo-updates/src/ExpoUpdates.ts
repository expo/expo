import { requireNativeModule } from 'expo-modules-core';

import { ExpoUpdatesModule } from './ExpoUpdatesModule.types';

/**
 * @internal
 */
export default requireNativeModule<ExpoUpdatesModule>('ExpoUpdates');
