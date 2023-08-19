import { CodedError, Platform } from 'expo-modules-core';
import FontObserver from 'fontfaceobserver';
import { FontDisplay } from './Font.types';
function getFontFaceStyleSheet() {
    if (!Platform.isDOMAvailable) {
        return null;
    }
    const styleSheet = getStyleElement();
    return styleSheet.sheet ? styleSheet.sheet : null;
}
function getFontFaceRules() {
    const sheet = getFontFaceStyleSheet();
    if (sheet) {
        // @ts-ignore: rule iterator
        const rules = [...sheet.cssRules];
        const items = [];
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
function getFontFaceRulesMatchingResource(fontFamilyName, options) {
    const rules = getFontFaceRules();
    return rules.filter(({ rule }) => {
        return (rule.style.fontFamily === fontFamilyName &&
            (options && options.display ? options.display === rule.style.fontDisplay : true));
    });
}
const serverContext = new Set();
function getHeadElements() {
    const entries = [...serverContext.entries()];
    if (!entries.length) {
        return [];
    }
    const css = entries.map(([{ css }]) => css).join('\n');
    const links = entries.map(([{ resourceId }]) => resourceId);
    // TODO: Maybe return nothing if no fonts were loaded.
    return [
        {
            $$type: 'style',
            children: css,
            id: ID,
            type: 'text/css',
        },
        ...links.map((resourceId) => ({
            $$type: 'link',
            rel: 'preload',
            href: resourceId,
            as: 'font',
            crossorigin: '',
        })),
    ];
}
export default {
    get name() {
        return 'ExpoFontLoader';
    },
    async unloadAllAsync() {
        if (!Platform.isDOMAvailable)
            return;
        const element = document.getElementById(ID);
        if (element && element instanceof HTMLStyleElement) {
            document.removeChild(element);
        }
    },
    async unloadAsync(fontFamilyName, options) {
        const sheet = getFontFaceStyleSheet();
        if (!sheet)
            return;
        const items = getFontFaceRulesMatchingResource(fontFamilyName, options);
        for (const item of items) {
            sheet.deleteRule(item.index);
        }
    },
    getServerResources() {
        const elements = getHeadElements();
        return elements.map((element) => {
            switch (element.$$type) {
                case 'style':
                    return `<style id="${element.id}" type="${element.type}">${element.children}</style>`;
                case 'link':
                    return `<link rel="${element.rel}" href="${element.href}" as="${element.as}" crossorigin="${element.crossorigin}" />`;
                default:
                    return '';
            }
        });
    },
    resetServerContext() {
        serverContext.clear();
    },
    isLoaded(fontFamilyName, resource = {}) {
        if (typeof window === 'undefined') {
            return !![...serverContext.values()].find((asset) => {
                return asset.name === fontFamilyName;
            });
        }
        return getFontFaceRulesMatchingResource(fontFamilyName, resource)?.length > 0;
    },
    // NOTE(EvanBacon): No async keyword! This cannot return a promise in Node environments.
    loadAsync(fontFamilyName, resource) {
        if (typeof window === 'undefined') {
            serverContext.add({
                name: fontFamilyName,
                css: _createWebFontTemplate(fontFamilyName, resource),
                // @ts-expect-error: typeof string
                resourceId: resource.uri,
            });
            return Promise.resolve();
        }
        const canInjectStyle = document.head && typeof document.head.appendChild === 'function';
        if (!canInjectStyle) {
            throw new CodedError('ERR_WEB_ENVIRONMENT', `The browser's \`document.head\` element doesn't support injecting fonts.`);
        }
        const style = getStyleElement();
        document.head.appendChild(style);
        const res = getFontFaceRulesMatchingResource(fontFamilyName, resource);
        if (!res.length) {
            _createWebStyle(fontFamilyName, resource);
        }
        if (!isFontLoadingListenerSupported()) {
            return Promise.resolve();
        }
        return new FontObserver(fontFamilyName, { display: resource.display }).load(null, 6000);
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
export function _createWebFontTemplate(fontFamily, resource) {
    return `@font-face{font-family:${fontFamily};src:url(${resource.uri});font-display:${resource.display || FontDisplay.AUTO}}`;
}
function _createWebStyle(fontFamily, resource) {
    const fontStyle = _createWebFontTemplate(fontFamily, resource);
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
function isFontLoadingListenerSupported() {
    const { userAgent } = window.navigator;
    // WebKit is broken https://github.com/bramstein/fontfaceobserver/issues/95
    const isIOS = !!userAgent.match(/iPad|iPhone/i);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    // Edge is broken https://github.com/bramstein/fontfaceobserver/issues/109#issuecomment-333356795
    const isEdge = userAgent.includes('Edge');
    // Internet Explorer
    const isIE = userAgent.includes('Trident');
    // Firefox
    const isFirefox = userAgent.includes('Firefox');
    return !isSafari && !isIOS && !isEdge && !isIE && !isFirefox;
}
//# sourceMappingURL=ExpoFontLoader.web.js.map