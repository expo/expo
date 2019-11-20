import FontObserver from 'fontfaceobserver';
import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import { CodedError } from '@unimodules/core';
import { FontDisplay } from './Font.types';
export default {
    get name() {
        return 'ExpoFontLoader';
    },
    async loadAsync(fontFamilyName, resource) {
        if (!canUseDOM) {
            return;
        }
        const canInjectStyle = document.head && typeof document.head.appendChild === 'function';
        if (!canInjectStyle) {
            throw new CodedError('ERR_WEB_ENVIRONMENT', `The browser's \`document.head\` element doesn't support injecting fonts.`);
        }
        const style = _createWebStyle(fontFamilyName, resource);
        document.head.appendChild(style);
        // https://github.com/bramstein/fontfaceobserver/issues/109#issuecomment-333356795
        if (navigator.userAgent.includes('Edge')) {
            return;
        }
        return new FontObserver(fontFamilyName).load();
    },
};
const ID = 'expo-generated-fonts';
function getStyleElement() {
    const element = document.getElementById(ID);
    if (element && element instanceof HTMLStyleElement) {
        return element;
    }
    const styleElement = document.createElement('style');
    styleElement.id = ID;
    styleElement.type = 'text/css';
    return styleElement;
}
function _createWebStyle(fontFamily, resource) {
    const fontStyle = `@font-face {
    font-family: ${fontFamily};
    src: url(${resource.uri});
    font-display: ${resource.display || FontDisplay.AUTO};
  }`;
    const styleElement = getStyleElement();
    // @ts-ignore: TypeScript does not define HTMLStyleElement::styleSheet. This is just for IE and
    // possibly can be removed if it's unnecessary on IE 11.
    if (styleElement.styleSheet) {
        const styleElementIE = styleElement;
        styleElementIE.styleSheet.cssText = styleElementIE.styleSheet.cssText
            ? styleElementIE.styleSheet.cssText + fontStyle
            : fontStyle;
    }
    else {
        const textNode = document.createTextNode(fontStyle);
        styleElement.appendChild(textNode);
    }
    return styleElement;
}
//# sourceMappingURL=ExpoFontLoader.web.js.map