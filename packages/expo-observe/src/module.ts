import { requireNativeModule } from 'expo';

import type { ExpoObserveModuleType } from './types';

export default requireNativeModule<ExpoObserveModuleType>('ExpoObserve');
