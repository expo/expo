import { requireNativeModule } from 'expo-modules-core';

import { CameraNativeModule } from './Camera.types';

export default requireNativeModule<CameraNativeModule>('ExpoCamera');
