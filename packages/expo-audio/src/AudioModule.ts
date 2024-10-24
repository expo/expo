import { requireNativeModule } from 'expo-modules-core';

import { AudioModuleDefinition } from './AudioModule.types';

/**
 * @hidden
 */
export default requireNativeModule<AudioModuleDefinition>('ExpoAudio');
