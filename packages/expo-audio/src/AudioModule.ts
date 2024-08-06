import { requireNativeModule } from 'expo-modules-core';

import { AudioModule } from './AudioModule.types';
export default requireNativeModule<AudioModule>('ExpoAudio');
