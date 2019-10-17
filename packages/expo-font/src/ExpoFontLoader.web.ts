import FontObserver from 'fontfaceobserver';
import { FontResource } from './Font.types';

export default {
  get name(): string {
    return 'ExpoFontLoader';
  },

  loadAsync(fontFamilyName: string, resource: FontResource): Promise<void> {
    const canInjectStyle = document.head && typeof document.head.appendChild === 'function';
    if (!canInjectStyle) {
      throw new Error('E_FONT_CREATION_FAILED : document element cannot support injecting fonts');
    }

    const style = _createWebStyle(fontFamilyName, resource);
    document.head!.appendChild(style);
    return new FontObserver(fontFamilyName).load();
  },
};

const ID = 'expo-generated-fonts';

function getStyleElement(): HTMLStyleElement {
  const element = document.getElementById(ID);
  if (element && element instanceof HTMLStyleElement) {
    return element;
  }
  const styleElement = document.createElement('style');
  styleElement.id = ID;
  styleElement.type = 'text/css';
  return styleElement;
}

function _createWebStyle(fontFamily: string, resource: FontResource): HTMLStyleElement {
  const fontStyle = `@font-face {
    font-family: ${fontFamily};
    src: url(${resource.uri});
  }`;

  const styleElement = getStyleElement();
  // @ts-ignore: TypeScript does not define HTMLStyleElement::styleSheet. This is just for IE and
  // possibly can be removed if it's unnecessary on IE 11.
  if (styleElement.styleSheet) {
    const styleElementIE = styleElement as any;
    styleElementIE.styleSheet.cssText = styleElementIE.styleSheet.cssText
      ? styleElementIE.styleSheet.cssText + fontStyle
      : fontStyle;
  } else {
    const textNode = document.createTextNode(fontStyle);
    styleElement.appendChild(textNode);
  }
  return styleElement;
}
