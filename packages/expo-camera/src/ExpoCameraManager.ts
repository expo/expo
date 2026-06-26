import { requireNativeModule } from 'expo';

import type { CameraNativeModule } from './Camera.types';

export default requireNativeModule<CameraNativeModule>('ExpoCamera');
