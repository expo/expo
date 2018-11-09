// @flow

class ExpoFontLoader {
  get name() {
    return 'ExpoFontLoader';
  }

  loadAsync(fontFamilyName: string, path: string): Promise {
    return null;
  }
}

export default new ExpoFontLoader();
