import { NativeModule, requireNativeModule } from 'expo-modules-core';

import { Album } from './types/Album';
import { Asset } from './types/Asset';
import { Query } from './types/Query';

declare class ExpoMediaLibraryNextModule extends NativeModule {
  Asset: typeof Asset;
  Album: typeof Album;
  Query: typeof Query;
}

export default requireNativeModule<ExpoMediaLibraryNextModule>('ExpoMediaLibraryNext');
