import { requireNativeModule } from 'expo';

import type { ImageManipulator } from './ImageManipulator.types';

export default requireNativeModule<ImageManipulator>('ExpoImageManipulator');
