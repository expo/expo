import { requireNativeModule } from 'expo-modules-core';

import type { NativeAudioModule } from './AudioModule.types';

/**
 * @hidden
 */
export default requireNativeModule<NativeAudioModule>('ExpoAudio');
