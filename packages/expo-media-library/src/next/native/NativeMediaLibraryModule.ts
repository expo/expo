import { requireNativeModule } from 'expo';

import type { NativeMediaLibraryModuleClass } from './types/NativeMediaLibraryModuleClass.types';

export const NativeMediaLibraryModule =
  requireNativeModule<NativeMediaLibraryModuleClass>('ExpoMediaLibraryNext');
export const NativeAsset = NativeMediaLibraryModule.Asset;
export const NativeAlbum = NativeMediaLibraryModule.Album;
export const NativeQuery = NativeMediaLibraryModule.Query;
