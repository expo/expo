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
            new Error('ExpoFontLoader.loadAsync(): The browser does not support linked fonts')
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
