import { CodedError, registerWebModule } from 'expo-modules-core';

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

// `_createWebFontTemplate` writes the family name quoted, but engines disagree about whether
// the CSSOM keeps the quotes (Firefox always does), so normalize them away before comparing.
function normalizeFontFamilyName(fontFamily: string): string {
  // jsdom leaves `style.fontFamily` undefined on the `@font-face` rules it parses.
  const trimmed = fontFamily?.trim();
  if (!trimmed) {
    return '';
  }
  const quote = trimmed[0];
  if (trimmed.length >= 2 && (quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1).replace(/\\(.)/g, '$1');
  }
  return trimmed;
}

function canonicalCssWeight(
  weight: number | string | null | undefined
): number | string | undefined {
  if (weight == null || weight === '') {
    return undefined;
  }
  if (typeof weight === 'number') {
    return Number.isFinite(weight) ? weight : undefined;
  }
  const lower = weight.trim().toLowerCase();
  if (lower === 'normal') {
    return 400;
  }
  if (lower === 'bold') {
    return 700;
  }
  const numeric = Number(lower);
  return Number.isFinite(numeric) ? numeric : lower;
}

// jsdom doesn't implement `CSSFontFaceRule`, so tests call this directly with plain `{ style }` objects.
export function _matchesFontFaceOptions(
  rule: Pick<CSSFontFaceRule, 'style'>,
  fontFamilyName: string,
  options?: UnloadFontOptions
): boolean {
  if (normalizeFontFamilyName(rule.style.fontFamily) !== fontFamilyName) {
    return false;
  }
  if (options?.display && options.display !== (rule.style as any).fontDisplay) {
    return false;
  }
  if (
    options?.weight != null &&
    canonicalCssWeight(options.weight) !== canonicalCssWeight(rule.style.fontWeight)
  ) {
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

export function _fontFaceRuleSrcMatches(
  rule: Pick<CSSFontFaceRule, 'style'>,
  uri: string | number | undefined
): boolean {
  const src = rule.style.getPropertyValue('src');
  const match = src.match(/url\((['"]?)([^'")]*)\1\)/);
  if (!match) {
    // Every rule carries a `url(...)`; an unreadable `src` means the engine doesn't expose it.
    return true;
  }
  let ruleUri = match[2] ?? '';
  try {
    ruleUri = decodeURIComponent(ruleUri);
  } catch {
    // decodeURIComponent throws on malformed percent-encoding; compare the raw value instead.
  }
  return ruleUri === String(uri);
}

const ExpoFontLoader: Required<Omit<ExpoFontLoaderModule, 'loadFontFamilyAsync'>> = {
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
    // Descending: `deleteRule` shifts every later index down by one.
    const descending = [...items].sort((a, b) => b.index - a.index);
    for (const item of descending) {
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
    const seen = new Set<string>();
    const families: string[] = [];
    for (const { rule } of getFontFaceRules()) {
      const name = normalizeFontFamilyName(rule.style.fontFamily);
      if (!seen.has(name)) {
        seen.add(name);
        families.push(name);
      }
    }
    return families;
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

    const alreadyLoaded = getFontFaceRulesMatchingResource(fontFamilyName, resource).some(
      ({ rule }) => _fontFaceRuleSrcMatches(rule, resource.uri)
    );
    if (!alreadyLoaded) {
      _createWebStyle(fontFamilyName, resource);
    }

    if (typeof document.fonts?.load !== 'function') {
      return Promise.resolve();
    }

    // Resolve when the browser has fetched the file, so text renders with it on resolution. The
    // face is selected with the `font` shorthand syntax; skip a descriptor the CSS sanitization
    // in `_createWebFontTemplate` drops, and a range weight, which the shorthand can't express.
    let shorthand = '';
    if (typeof resource.style === 'string' && CSS_IDENT_RE.test(resource.style)) {
      shorthand += `${resource.style} `;
    }
    if (
      (typeof resource.weight === 'number' && Number.isFinite(resource.weight)) ||
      (typeof resource.weight === 'string' &&
        (CSS_IDENT_RE.test(resource.weight) ||
          (CSS_WEIGHT_NUMERIC_RE.test(resource.weight) && !resource.weight.includes(' '))))
    ) {
      shorthand += `${resource.weight} `;
    }
    return document.fonts
      .load(`${shorthand}1em ${JSON.stringify(fontFamilyName)}`)
      .then(() => undefined);
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
// CSS font weights run from 1 to 1000, alone or as a variable-font range ('100 900').
// No leading zero: '0400' is not a weight.
const CSS_WEIGHT_NUMERIC_RE = /^(1000|[1-9]\d{0,2})( (1000|[1-9]\d{0,2}))?$/;

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
  } else if (
    typeof resource.weight === 'string' &&
    (CSS_IDENT_RE.test(resource.weight) || CSS_WEIGHT_NUMERIC_RE.test(resource.weight))
  ) {
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
