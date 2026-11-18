import { requireNativeModule } from 'expo';

import type { ExpoUpdatesModule } from './ExpoUpdatesModule.types';

/**
 * @internal
 */
export default requireNativeModule<ExpoUpdatesModule>('ExpoUpdates');
