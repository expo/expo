export default {
    get name() {
        return 'ExpoFontLoader';
    },
    loadAsync(fontFamilyName, resource) {
        const canInjectStyle = document.head && typeof document.head.appendChild === 'function';
        if (!canInjectStyle) {
            throw new Error('E_FONT_CREATION_FAILED : document element cannot support injecting fonts');
        }
        const style = _createWebStyle(fontFamilyName, resource);
        document.head.appendChild(style);
        return Promise.resolve();
    },
};
function _createWebStyle(fontFamily, resource) {
    const fontStyle = `@font-face {
    font-family: ${fontFamily};
    src: url(${resource});
  }`;
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    // @ts-ignore: TypeScript does not define HTMLStyleElement::styleSheet. This is just for IE and
    // possibly can be removed if it's unnecessary on IE 11.
    if (styleElement.styleSheet) {
        // @ts-ignore
        styleElement.styleSheet.cssText = fontStyle;
    }
    else {
        const textNode = document.createTextNode(fontStyle);
        styleElement.appendChild(textNode);
    }
    return styleElement;
}
//# sourceMappingURL=ExpoFontLoader.web.js.map