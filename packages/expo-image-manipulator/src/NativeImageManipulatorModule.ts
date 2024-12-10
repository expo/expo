import { requireNativeModule } from 'expo';

import { ImageManipulator } from './ImageManipulator.types';

export default requireNativeModule<ImageManipulator>('ExpoImageManipulator');
