// @flow

function isFunction(method) {
  return method && typeof method === 'function';
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

export default {
  get name(): string {
    return 'ExpoFontLoader';
  },
  loadAsync(fontFamilyName: string, resource: string): Promise {
    const canInjectStyle = isFunction(document.head.appendChild);

    if (!canInjectStyle) {
      throw new Error('E_FONT_CREATION_FAILED : document element cannot support injecting fonts');
    }
    const style = createWebStyle(fontFamilyName, resource);
    document.head.appendChild(style);
    return Promise.resolve();
  },
};
