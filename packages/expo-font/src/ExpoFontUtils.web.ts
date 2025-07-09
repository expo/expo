import { NativeModule, registerWebModule, UnavailabilityError } from 'expo-modules-core';

import { RenderToImageOptions } from './FontUtils.types';

class ExpoFontUtils extends NativeModule {
  async renderToImageAsync(glyphs: string, options?: RenderToImageOptions): Promise<string> {
    throw new UnavailabilityError('expo-font', 'renderToImageAsync');
  }
}

export default registerWebModule(ExpoFontUtils, 'ExpoFontUtils');
