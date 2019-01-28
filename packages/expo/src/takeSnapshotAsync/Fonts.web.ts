import { batchProcessAllSourcesAsync, shouldProcess } from './ProcessSources.web';
import { makeIterable } from './Utils.web';

export type WebFontAction = {
  resolve: () => Promise<string>;
  src: () => string;
};

function findAllFontsForDocument(document = global.document): WebFontAction[] {
  const styleSheets: StyleSheetList = document.styleSheets;
  const sheets: CSSStyleSheet[] = makeIterable(styleSheets);
  const cssRules = getCSSRules(sheets);
  const rulesToProcess = cssRules
    .filter(({ type }) => type === CSSRule.FONT_FACE_RULE)
    .filter(({ style }) => shouldProcess(style.getPropertyValue('src')));

  return rulesToProcess.map(item => createNewFontForCSSRule(item));
}

function createNewFontForCSSRule({
  parentStyleSheet,
  cssText,
  style,
}: CSSStyleRule): WebFontAction {
  return {
    async resolve(): Promise<string> {
      let initialURL;
      if (parentStyleSheet && parentStyleSheet.href != null) {
        initialURL = parentStyleSheet.href;
      }
      return await batchProcessAllSourcesAsync(cssText, initialURL);
    },
    src(): string {
      return style.getPropertyValue('src');
    },
  };
}

function getCSSRules(styleSheets: CSSStyleSheet[]): CSSStyleRule[] {
  const cssRules: CSSStyleRule[] = [];
  for (const sheet of styleSheets) {
    try {
      const rules: CSSRule[] = makeIterable(sheet.cssRules);
      rules.forEach(cssRules.push.bind(cssRules));
    } catch ({ message }) {
      throw new Error(`Error while reading CSS rules from ${sheet.href}: ${message}`);
    }
  }
  return cssRules;
}

export async function batchResolveAllFontsAsync(element: HTMLElement): Promise<HTMLElement> {
  const webFonts = findAllFontsForDocument(document);
  const fontCSSStyles = await Promise.all(webFonts.map(webFont => webFont.resolve()));
  const fontCSSString = fontCSSStyles.join('\n');

  const styleNode = document.createElement('style');
  element.appendChild(styleNode);
  styleNode.appendChild(document.createTextNode(fontCSSString));
  return element;
}
