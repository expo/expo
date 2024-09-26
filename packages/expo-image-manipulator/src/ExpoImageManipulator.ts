import { requireNativeModule } from 'expo-modules-core';

import { ImageManipulator } from './ImageManipulator.types';

export default requireNativeModule<ImageManipulator>('ExpoImageManipulator');
