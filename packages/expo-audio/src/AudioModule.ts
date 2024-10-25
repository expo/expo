import { requireNativeModule } from 'expo-modules-core';

import { NativeAudioModule } from './AudioModule.types';

/**
 * @hidden
 */
export default requireNativeModule<NativeAudioModule>('ExpoAudio');
