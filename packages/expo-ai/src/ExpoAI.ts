import { requireOptionalNativeModule } from 'expo';

import type { NativeLanguageModels } from './NativeLanguageModels.types';

export default requireOptionalNativeModule<NativeLanguageModels>('ExpoAI');
