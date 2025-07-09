import { NativeModule } from 'expo';
import { registerWebModule } from 'expo-modules-core';
import { SharedRef } from 'expo-modules-core/types';

import ImageManipulatorContext from './web/ImageManipulatorContext.web';
import ImageManipulatorImageRef from './web/ImageManipulatorImageRef.web';
import { loadImageAsync } from './web/utils.web';

class ImageManipulator extends NativeModule {
  Context = ImageManipulatorContext;
  Image = ImageManipulatorImageRef;

  manipulate(source: string | SharedRef<'image'>): ImageManipulatorContext {
    return new ImageManipulatorContext(() => {
      if (typeof source === 'string') {
        return loadImageAsync(source);
      }
      // Image refs should provide the `uri` property on Web. It could be either remote url, blob or data url.
      if (typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
        return loadImageAsync(source.uri);
      }
      throw new Error(`Source not supported: ${source}`);
    });
  }
}

export default registerWebModule(ImageManipulator, 'ImageManipulator');
