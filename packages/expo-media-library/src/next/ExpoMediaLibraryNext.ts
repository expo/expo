import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type { Asset, Album } from './MediaLibraryNext.types';

declare class ExpoMediaLibraryNextModule extends NativeModule {
  Asset: typeof Asset;
  Album: typeof Album;
}

export default requireNativeModule<ExpoMediaLibraryNextModule>('ExpoMediaLibraryNext');
