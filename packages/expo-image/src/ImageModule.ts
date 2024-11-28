import { requireNativeModule } from 'expo';

import type { ImageNativeModule } from './Image.types';

export default requireNativeModule<ImageNativeModule>('ExpoImage');
