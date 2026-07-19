import { CodedError, registerWebModule } from 'expo-modules-core';
import FontObserver from 'fontfaceobserver';

import type { ExpoFontLoaderModule } from './ExpoFontLoader';
import type { UnloadFontOptions } from './Font';
import type { FontResource } from './Font.types';
import {
  addServerFont,
  getLoadedServerFonts,
  getServerResourceDescriptors as readServerResourceDescriptors,
  isServerFontLoaded,
} from './serverContext';

function getFontFaceStyleSheet(): CSSStyleSheet | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const styleSheet = getStyleElement();
  return styleSheet.sheet ? (styleSheet.sheet as CSSStyleSheet) : null;
}

type RuleItem = { rule: CSSFontFaceRule; index: number };

function getFontFaceRules(): RuleItem[] {
  const sheet = getFontFaceStyleSheet();
  if (sheet) {
    // @ts-ignore: rule iterator
    const rules = [...sheet.cssRules];

    const items: RuleItem[] = [];

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (rule instanceof CSSFontFaceRule) {
        items.push({ rule, index: i });
      }
    }
    return items;
  }
  return [];
}

// Exported for testing: jsdom doesn't implement `CSSFontFaceRule`, so tests exercise this matching
// logic directly with plain `{ style }` objects instead of going through `getFontFaceRules()`.
export function _matchesFontFaceOptions(
  rule: Pick<CSSFontFaceRule, 'style'>,
  fontFamilyName: string,
  options?: UnloadFontOptions
): boolean {
  if (rule.style.fontFamily !== fontFamilyName) {
    return false;
  }
  if (options?.display && options.display !== (rule.style as any).fontDisplay) {
    return false;
  }
  if (options?.weight != null && String(options.weight) !== rule.style.fontWeight) {
    return false;
  }
  if (options?.style != null && options.style !== rule.style.fontStyle) {
    return false;
  }
  return true;
}

function getFontFaceRulesMatchingResource(
  fontFamilyName: string,
  options?: UnloadFontOptions
): RuleItem[] {
  return getFontFaceRules().filter(({ rule }) =>
    _matchesFontFaceOptions(rule, fontFamilyName, options)
  );
}

const ExpoFontLoader: Required<ExpoFontLoaderModule> = {
  async unloadAllAsync(): Promise<void> {
    if (typeof window === 'undefined') return;

    const element = document.getElementById(ID);
    if (element && element instanceof HTMLStyleElement) {
      document.removeChild(element);
    }
  },

  async unloadAsync(fontFamilyName: string, options?: UnloadFontOptions): Promise<void> {
    const sheet = getFontFaceStyleSheet();
    if (!sheet) return;
    const items = getFontFaceRulesMatchingResource(fontFamilyName, options);
    for (const item of items) {
      sheet.deleteRule(item.index);
    }
  },

  getServerResources(): string[] {
    const elements = readServerResourceDescriptors();

    return elements
      .map((element) => {
        switch (element.type) {
          case 'style':
            return `<style id="${element.id}">${element.css}</style>`;
          case 'link':
            return `<link rel="${element.rel}" href="${element.href}" as="${element.as}" crossorigin="${element.crossOrigin}" />`;
          default:
            return '';
        }
      })
      .filter(Boolean);
  },

  getServerResourceDescriptors() {
    return readServerResourceDescriptors();
  },

  getLoadedFonts(): string[] {
    if (typeof window === 'undefined') {
      return getLoadedServerFonts();
    }
    const rules = getFontFaceRules();
    return rules.map(({ rule }) => rule.style.fontFamily);
  },

  isLoaded(fontFamilyName: string, resource: UnloadFontOptions = {}): boolean {
    if (typeof window === 'undefined') {
      return isServerFontLoaded(fontFamilyName);
    }
    return getFontFaceRulesMatchingResource(fontFamilyName, resource)?.length > 0;
  },

  // NOTE(vonovak): This is used in RN vector-icons to load fonts dynamically on web. Changing the signature is breaking.
  // NOTE(EvanBacon): No async keyword! This cannot return a promise in Node environments.
  loadAsync(fontFamilyName: string, resource: FontResource): Promise<void> {
    if (__DEV__ && typeof resource !== 'object') {
      // to help devving on web, where loadAsync interface is different from native
      throw new CodedError(
        'ERR_FONT_SOURCE',
        `Expected font resource of type \`object\` instead got: ${typeof resource}`
      );
    }
    if (typeof window === 'undefined') {
      addServerFont({
        name: fontFamilyName,
        css: _createWebFontTemplate(fontFamilyName, resource),
        // @ts-expect-error: typeof string
        resourceId: resource.uri!,
      });
      return Promise.resolve();
    }

    const canInjectStyle = document.head && typeof document.head.appendChild === 'function';
    if (!canInjectStyle) {
      throw new CodedError(
        'ERR_WEB_ENVIRONMENT',
        `The browser's \`document.head\` element doesn't support injecting fonts.`
      );
    }

    const style = getStyleElement();
    document.head!.appendChild(style);

    const res = getFontFaceRulesMatchingResource(fontFamilyName, resource);
    if (!res.length) {
      _createWebStyle(fontFamilyName, resource);
    }

    if (!isFontLoadingListenerSupported()) {
      return Promise.resolve();
    }

    return new FontObserver(fontFamilyName, {
      // @ts-expect-error: TODO(@kitten): Typings indicate that the polyfill may not support this?
      display: resource.display,
    }).load(resource.testString ?? null, 12000);
  },
};

const isServer = process.env.EXPO_OS === 'web' && typeof window === 'undefined';

function createExpoFontLoader() {
  return ExpoFontLoader;
}
const toExport = isServer
  ? ExpoFontLoader
  : // @ts-expect-error: registerWebModule calls `new` on the module implementation.
    // Normally that'd be a class but that doesn't work on server, so we use a function instead.
    // TS doesn't like that but we don't need it to be a class.
    registerWebModule(createExpoFontLoader, 'ExpoFontLoader');

export default toExport as typeof ExpoFontLoader;

const ID = 'expo-generated-fonts';

function getStyleElement(): HTMLStyleElement {
  const element = document.getElementById(ID);
  if (element && element instanceof HTMLStyleElement) {
    return element;
  }
  const styleElement = document.createElement('style');
  styleElement.id = ID;

  return styleElement;
}

const CSS_IDENT_RE = /^[a-zA-Z_-][\w-]*$/;

// None of `display`/`weight`/`style` are given a hardcoded default: omitting a descriptor lets
// the browser fall back to its own default, which matters for variable fonts (a single file can
// cover a range of weights/styles; forcing e.g. `font-weight: 400` on it would incorrectly
// restrict the face to only that one weight).
export function _createWebFontTemplate(fontFamily: string, resource: FontResource): string {
  const declarations = [
    `font-family:${JSON.stringify(fontFamily)}`,
    `src:url(${JSON.stringify(resource.uri)})`,
  ];

  if (typeof resource.display === 'string' && CSS_IDENT_RE.test(resource.display)) {
    declarations.push(`font-display:${resource.display}`);
  }

  if (typeof resource.weight === 'number' && Number.isFinite(resource.weight)) {
    declarations.push(`font-weight:${resource.weight}`);
  } else if (typeof resource.weight === 'string' && CSS_IDENT_RE.test(resource.weight)) {
    declarations.push(`font-weight:${resource.weight}`);
  }

  if (typeof resource.style === 'string' && CSS_IDENT_RE.test(resource.style)) {
    declarations.push(`font-style:${resource.style}`);
  }

  return `@font-face{${declarations.join(';')}}`;
}

function _createWebStyle(fontFamily: string, resource: FontResource): HTMLStyleElement {
  const fontStyle = _createWebFontTemplate(fontFamily, resource);

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

function isFontLoadingListenerSupported(): boolean {
  const { userAgent } = window.navigator;
  // WebKit is broken https://github.com/bramstein/fontfaceobserver/issues/95
  const isIOS = !!userAgent.match(/iPad|iPhone/i);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  // Edge is broken https://github.com/bramstein/fontfaceobserver/issues/109#issuecomment-333356795
  const isEdge = userAgent.includes('Edge');
  // Internet Explorer
  const isIE = userAgent.includes('Trident');
  return !isSafari && !isIOS && !isEdge && !isIE;
}
