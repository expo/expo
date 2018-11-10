// @flow

function isFunction(functionToCheck) {
  return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function createWebStyle(fontFamily, resource) {
  const fontStyle = `@font-face {
    font-family: ${fontFamily};
    src: url(${resource});
  }`;

  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = fontStyle;
  } else {
    const textNode = document.createTextNode(fontStyle);
    styleElement.appendChild(textNode);
  }
  return styleElement;
}

class ExpoFontLoader {
  get name() {
    return 'ExpoFontLoader';
  }

  loadAsync(fontFamilyName: string, resource: string): Promise {
    const canInjectStyle =
      document &&
      document.head &&
      isFunction(document.head.appendChild) &&
      isFunction(document.createElement) &&
      isFunction(document.createTextNode);

    if (!canInjectStyle) {
      throw new Error('E_FONT_CREATION_FAILED : document element cannot support injecting fonts');
    }
    const style = createWebStyle(fontFamilyName, resource);
    document.head.appendChild(style);
    return Promise.resolve();
  }
}

export default new ExpoFontLoader();
