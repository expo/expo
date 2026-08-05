import { NativeModule, registerWebModule } from 'expo';
import type { SharedRef } from 'expo-modules-core/types';

import type { ImageLoadOptions } from './ImageManipulator.types';
import ImageManipulatorContext from './web/ImageManipulatorContext.web';
import ImageManipulatorImageRef from './web/ImageManipulatorImageRef.web';
import { loadImageAsync } from './web/utils.web';

class ImageManipulator extends NativeModule {
  Context = ImageManipulatorContext;
  Image = ImageManipulatorImageRef;

  manipulate(
    source: string | SharedRef<'image'>,
    options?: ImageLoadOptions
  ): ImageManipulatorContext {
    return new ImageManipulatorContext(() => {
      if (typeof source === 'string') {
        return loadImageAsync(source, options);
      }
      // Image refs should provide the `uri` property on Web. It could be either remote url, blob or data url.
      if (typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
        return loadImageAsync(source.uri, options);
      }
      throw new Error(`Source not supported: ${source}`);
    });
  }
}

export default registerWebModule(ImageManipulator, 'ImageManipulator');
