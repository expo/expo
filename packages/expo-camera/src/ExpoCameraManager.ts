import { requireNativeModule } from 'expo-modules-core';

import type { CameraNativeModule } from './Camera.types';

export default requireNativeModule<CameraNativeModule>('ExpoCamera');
