import { ConfigPlugin } from '@expo/config-plugins';

import {
  applyImageToSplashScreenXML,
  IBSplashScreenDocument,
  ImageContentMode,
  removeImageFromSplashScreen,
} from './InterfaceBuilder';
import { IOSSplashConfig } from './getIosSplashConfig';
import { withIosSplashScreenStoryboard } from './withIosSplashScreenStoryboard';

export const withIosSplashScreenImage: ConfigPlugin<IOSSplashConfig> = (config, splash) => {
  return withIosSplashScreenStoryboard(config, config => {
    config.modResults = applySplashScreenStoryboard(config.modResults, splash);
    return config;
  });
};

export function applySplashScreenStoryboard(obj: IBSplashScreenDocument, splash: IOSSplashConfig) {
  const resizeMode = splash?.resizeMode;
  const splashScreenImagePresent = Boolean(splash?.image);
  const imageName = 'SplashScreen';
  // Only get the resize mode when the image is present.
  if (splashScreenImagePresent) {
    const contentMode = getImageContentMode(resizeMode || 'contain');
    return applyImageToSplashScreenXML(obj, {
      contentMode,
      imageName,
    });
  }

  return removeImageFromSplashScreen(obj, { imageName });
}

function getImageContentMode(resizeMode: string): ImageContentMode {
  switch (resizeMode) {
    case 'contain':
      return 'scaleAspectFit';
    case 'cover':
      return 'scaleAspectFill';
    default:
      throw new Error(`{ resizeMode: "${resizeMode}" } is not supported for iOS platform.`);
  }
}
