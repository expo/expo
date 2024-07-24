import { requireNativeModule } from 'expo';

import { ExpoUpdatesModule } from './ExpoUpdatesModule.types';

/**
 * @internal
 */
export default requireNativeModule<ExpoUpdatesModule>('ExpoUpdates');
