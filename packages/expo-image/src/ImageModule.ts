import { type NativeModule, requireNativeModule } from 'expo';

import { type ImageRef, type ImageSource } from './Image.types';

// TODO: Add missing function declarations
declare class ImageModule extends NativeModule {
  Image: typeof ImageRef;

  loadAsync(source: ImageSource): Promise<ImageRef>;
}

export default requireNativeModule<ImageModule>('ExpoImage');
