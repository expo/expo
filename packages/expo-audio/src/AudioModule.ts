import { requireNativeModule } from 'expo';

import { AudioModule } from './AudioModule.types';
export default requireNativeModule<AudioModule>('ExpoAudio');
