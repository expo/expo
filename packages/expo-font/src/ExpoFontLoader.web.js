// @flow

import WebFont from 'webfontloader';

export default {
  get name(): string {
    return 'ExpoFontLoader';
  },
  loadAsync(fontFamilyName: string, fontUri: string): Promise {
    return new Promise((resolve, reject) => {
      WebFont.load({
        active: resolve,
        inactive() {
          reject(
            new Error(
              `ExpoFontLoader.loadAsync(): The browser does not support linked fonts or the font ${fontFamilyName} could not be loaded from: ${fontUri}`
            )
          );
        },
        custom: {
          families: [fontFamilyName],
          urls: [fontUri],
        },
      });
    });
  },
};
