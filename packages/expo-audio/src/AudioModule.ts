import { requireNativeModule } from 'expo';

import type { NativeAudioModule } from './AudioModule.types';

/**
 * @hidden
 */
export default requireNativeModule<NativeAudioModule>('ExpoAudio');
